// S3 thin client: the phone/browser is a dumb terminal. All engine state lives on the server; this
// module only (1) renders the server's output events, (2) sends the user's input, and (3) keeps a
// durable session id so a socket drop (lock/background/network blip) reconnects to the SAME live
// server session and `resume`s the pending prompt instead of restarting the game.
//
// It speaks the exact wire protocol verified headlessly in server/ws-server-test.mjs:
//   server -> client : {type:'session',id,resumed} | {type:'events',id,events} | {type:'waiting',id,event,deadline,stack}
//                       | {type:'running',id} | {type:'saved',key} | {type:'ended'} | {type:'error',error}
//   client -> server : {type:'start'} | {type:'resume'} | {type:'input',id,value}
//                       | {type:'rendered',id} | {type:'waiting-ack',id}
// The render vocabulary (content/line/clear + string/button children + style) is ported from the
// browser probe renderer (tools/web-engine-probe/browser.mjs) so output looks identical.
const $ = sel => document.querySelector(sel);
const output = $('#output'), input = $('#input'), submit = $('#submit');
const statusEl = $('#status'), notice = $('#notice'), errorEl = $('#error'), conn = $('#conn');

// ---- durable session id (survives reloads / app restarts within the server grace window) --------
const STORE_KEY = 'era-thin-session';
const params = new URLSearchParams(location.search);
const token = params.get('token') || '';
function loadSessionId() { try { return localStorage.getItem(STORE_KEY) || null; } catch { return null; } }
function saveSessionId(id) { try { localStorage.setItem(STORE_KEY, id); } catch {} }

// ---- terminal state -----------------------------------------------------------------------------
let ws = null, sessionId = loadSessionId(), waiting = null, lastBatch = 0, epoch = 0;
let reconnectTimer = null, retries = 0, composing = false, manualClose = false;
const choiceButtons = new Set();
const rowButtons = new WeakMap();
// Scroll: follow the bottom while output streams, but after a deliberate input reveal the TOP of the
// new screen (long menus are taller than the viewport — the original "tap does nothing, scroll up
// and the shop is there" bug). followNext marks the input-triggered redraw; screenTop is its anchor.
let followNext = false, screenTop = null, scrollFrame = null;

// Test/inspection hook (used by the headless browser smoke). Never carries secrets.
const probe = { connected: false, resumed: null, waiting: null, ended: false, error: null, saved: [], get text() { return textOf(); } };
window.__thin = probe;

function state(text) { statusEl.textContent = text; }
function textOf() {
  return [...output.querySelectorAll('.game-line')].map(r => r.textContent).join('\n');
}

// ---- rendering (ported from browser.mjs) --------------------------------------------------------
function applyStyle(node, style) {
  style ??= {};
  if (/^[\da-f]{6}$/i.test(style.color)) node.style.color = '#' + style.color;
  if (style.bold) node.style.fontWeight = 'bold';
  if (style.italic) node.style.fontStyle = 'italic';
  if (style.underline || style.strike) node.style.textDecoration =
    style.underline ? (style.strike ? 'underline line-through' : 'underline') : 'line-through';
}
function removeRow(row) {
  const buttons = rowButtons.get(row);
  if (buttons) for (const b of buttons) choiceButtons.delete(b);
  row.remove();
}
function render(event, fragment) {
  const row = document.createElement('div');
  row.className = 'game-line';
  if (event.type === 'content') {
    if (event.align === 'CENTER' || event.align === 'RIGHT') row.style.textAlign = event.align.toLowerCase();
    if (event.children.length === 1 && event.children[0].type === 'string') {
      row.textContent = event.children[0].text;
      applyStyle(row, event.children[0].style);
    } else {
      const buttons = [];
      for (const chunk of event.children) {
        const node = document.createElement(chunk.type === 'button' ? 'button' : 'span');
        node.textContent = chunk.text;
        applyStyle(node, chunk.style);
        if (chunk.type === 'button') {
          node.type = 'button'; node.disabled = true;
          node.dataset.value = String(chunk.value); node.dataset.epoch = String(epoch);
          choiceButtons.add(node); buttons.push(node);
        }
        row.append(node);
      }
      if (buttons.length) rowButtons.set(row, buttons);
    }
  } else row.textContent = event.value || '────────────────────────';
  fragment.append(row);
}
function renderBatch(events) {
  const follow = followNext || nearBottom();
  const pending = [];
  for (const event of events) {
    if (event.type === 'clear') {
      for (let n = 0; n < event.count; n++) {
        if (pending.length) pending.pop();
        else if (output.lastChild) removeRow(output.lastChild);
        else break;
      }
    } else if (event.type === 'content' || event.type === 'line') pending.push(event);
    else notice.textContent = '미지원 출력 이벤트: ' + event.type;
  }
  const fragment = document.createDocumentFragment();
  for (const event of pending) render(event, fragment);
  const firstNew = fragment.firstElementChild;
  output.append(fragment);
  while (output.childElementCount > 2000) removeRow(output.firstChild);
  if (firstNew && screenTop === null) screenTop = firstNew;
  if (follow) { if (followNext) scrollNewScreen(); else scrollBottom(); }
}
function nearBottom() { return (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 80; }
function scrollBottom() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = null; window.scrollTo(0, document.documentElement.scrollHeight); });
}
function scrollNewScreen() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    const doc = document.documentElement;
    const avail = window.innerHeight - ($('#composer').getBoundingClientRect().height || 0);
    if (screenTop && screenTop.isConnected) {
      const topAbs = screenTop.getBoundingClientRect().top + window.scrollY;
      if (doc.scrollHeight - topAbs > avail) { window.scrollTo(0, Math.max(0, topAbs - 4)); return; }
    }
    window.scrollTo(0, doc.scrollHeight);
  });
}

// ---- input controls -----------------------------------------------------------------------------
function controls(enabled) {
  const pause = enabled && waiting?.type === 'wait';
  $('#continue').hidden = !pause; $('#continue').disabled = !pause;
  submit.textContent = pause ? '계속 ▶' : '전송';
  submit.disabled = !enabled; input.disabled = !enabled;
  for (const b of choiceButtons) b.disabled = !enabled;
}
function endChoice() { waiting = null; probe.waiting = null; controls(false); choiceButtons.clear(); }
function send(value) {
  if (!waiting || !ws || ws.readyState !== WebSocket.OPEN) return;
  if (waiting.type === 'wait') value = '';
  if (waiting.type !== 'wait' && waiting.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
    notice.textContent = '정수를 입력하세요. 안전 범위 밖 숫자는 거절합니다.'; return;
  }
  notice.textContent = '';
  followNext = true; screenTop = null;
  const id = waiting.id;
  endChoice(); state('실행 중');
  ws.send(JSON.stringify({ type: 'input', id, value }));
}

// ---- protocol handling --------------------------------------------------------------------------
function onMessage(raw) {
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  switch (msg.type) {
    case 'session': {
      sessionId = msg.id; saveSessionId(sessionId);
      probe.resumed = msg.resumed;
      conn.textContent = msg.resumed ? '연결됨 · 이어서 진행' : '연결됨 · 새 세션';
      // Resumed: the server session is alive; ask it to re-announce the pending prompt. Fresh: start.
      if (msg.resumed) ws.send(JSON.stringify({ type: 'resume' }));
      else ws.send(JSON.stringify({ type: 'start' }));
      break;
    }
    case 'events':
      // A resent batch (id already seen) is re-acked without re-rendering, so a lost ack cannot
      // duplicate output; only a newer id draws.
      if (msg.id > lastBatch) { renderBatch(msg.events); lastBatch = msg.id; }
      ws.send(JSON.stringify({ type: 'rendered', id: msg.id }));
      break;
    case 'running':
      if (waiting?.id === msg.id) { endChoice(); followNext = true; screenTop = null; }
      notice.textContent = ''; state('실행 중');
      break;
    case 'waiting':
      // Ack every announcement so the server stops resending this id. Re-announcing a prompt we are
      // already showing is idempotent; but if our controls were disabled (input sent then rejected)
      // we fall through and re-open the input path — the anti-freeze recovery.
      ws.send(JSON.stringify({ type: 'waiting-ack', id: msg.id }));
      if (waiting && waiting.id === msg.id) break;
      waiting = { ...msg.event, id: msg.id, deadline: msg.deadline };
      probe.waiting = { id: msg.id, type: waiting.type };
      controls(true); epoch++;
      input.inputMode = msg.event.numeric ? 'numeric' : 'text';
      input.placeholder = msg.event.type === 'wait' ? '입력 없이 계속 ▶ 버튼을 누르세요' : '값을 입력하거나 선택지를 누르세요';
      notice.textContent = msg.event.type === 'wait' ? '멈춘 것이 아닙니다. 계속 ▶ 버튼을 누르면 진행합니다.' : '';
      if (followNext) scrollNewScreen();
      followNext = false;
      state('입력 대기');
      break;
    case 'saved':
      probe.saved.push(msg.key); notice.textContent = '저장 완료: ' + msg.key;
      break;
    case 'ended':
      probe.ended = true; endChoice(); state('종료됨');
      // The run is over; a reconnect would only start a fresh session, so forget the id.
      try { localStorage.removeItem(STORE_KEY); } catch {}
      break;
    case 'error':
      probe.error = msg.error; errorEl.textContent = JSON.stringify(msg.error, null, 2);
      endChoice(); state('오류');
      break;
  }
}

// ---- connection lifecycle -----------------------------------------------------------------------
function wsUrl() {
  const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const q = new URLSearchParams();
  if (sessionId) q.set('session', sessionId);
  if (token) q.set('token', token);
  const qs = q.toString();
  return `${scheme}//${location.host}/${qs ? '?' + qs : ''}`;
}
function connect() {
  clearTimeout(reconnectTimer); reconnectTimer = null;
  manualClose = false;
  conn.textContent = sessionId ? '재접속 중…' : '서버 연결 중…';
  let socket;
  try { socket = new WebSocket(wsUrl()); } catch { scheduleReconnect(); return; }
  ws = socket;
  socket.addEventListener('open', () => { retries = 0; probe.connected = true; });
  socket.addEventListener('message', ev => onMessage(ev.data));
  socket.addEventListener('close', () => {
    if (socket !== ws) return;
    probe.connected = false;
    controls(false);
    if (manualClose || probe.ended) { conn.textContent = '연결 종료'; return; }
    conn.textContent = '연결 끊김 · 재접속 대기';
    scheduleReconnect();
  });
  socket.addEventListener('error', () => { try { socket.close(); } catch {} });
}
function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = Math.min(1000 * 2 ** retries, 8000); retries++;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, delay);
}

// Foreground wake / reconnect: re-check the pending prompt so a throttled/dropped input can't leave
// the screen dead. If the socket died while backgrounded, reconnect (which resumes on hello).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resume' }));
  else if (!probe.ended) connect();
});

// ---- input wiring -------------------------------------------------------------------------------
output.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button && !button.disabled && choiceButtons.has(button)) send(button.dataset.value);
});
$('form').addEventListener('submit', event => {
  event.preventDefault();
  if (composing) return;
  const value = input.value; send(value); if (!waiting) input.value = '';
});
input.addEventListener('compositionstart', () => { composing = true; });
input.addEventListener('compositionend', () => { composing = false; });
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.isComposing || composing || event.keyCode === 229)) event.preventDefault();
});
$('#continue').addEventListener('click', () => { if (waiting?.type === 'wait') send(''); });
$('#latest').addEventListener('click', scrollBottom);
$('#recover').addEventListener('click', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'resume' }));
    ws.send(JSON.stringify({ type: 'rendered', id: lastBatch }));
    notice.textContent = '복구를 시도했습니다. 잠시 기다려 주세요.';
  } else connect();
});

controls(false);
connect();
