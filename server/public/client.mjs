// S3 thin client: dumb terminal over WS. Keep this close to tools/web-engine-probe/browser.mjs.
const $ = sel => document.querySelector(sel);
const output = $('#output'), input = $('#input'), submit = $('#submit');
const statusEl = $('#status'), notice = $('#notice'), errorEl = $('#error'), conn = $('#conn');

const STORE_KEY = 'era-thin-session';
const BUILD = 'tap-fix13';
const params = new URLSearchParams(location.search);
const token = params.get('token') || '';
const wantFresh = params.has('fresh');
function loadSessionId() {
  if (wantFresh) { try { localStorage.removeItem(STORE_KEY); } catch {} return null; }
  try { return localStorage.getItem(STORE_KEY) || null; } catch { return null; }
}
function saveSessionId(id) { try { localStorage.setItem(STORE_KEY, id); } catch {} }

let ws = null, sessionId = loadSessionId(), waiting = null, lastBatch = 0, epoch = 0;
let reconnectTimer = null, retries = 0, composing = false, manualClose = false;
const choiceButtons = new Set();
const rowButtons = new WeakMap();
let followNext = false, screenTop = null, scrollFrame = null;
// Collect post-input output and paint as the only screen. era shop does not CLEARLINE the main
// menu, so appending leaves menu+shop stacked.
let redrawBuffer = null;

const probe = { connected: false, resumed: null, waiting: null, ended: false, error: null, saved: [], get text() { return textOf(); } };
window.__thin = probe;

const buildEl = $('#build');
if (buildEl) buildEl.textContent = `build ${BUILD} · js ok`;

function state(text) { statusEl.textContent = text; }
function textOf() {
  return [...output.querySelectorAll('.game-line')].map(r => r.textContent).join('\n');
}

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
function renderBatch(events, { replace = false } = {}) {
  const follow = !replace && (followNext || nearBottom());
  if (replace) {
    while (output.firstChild) removeRow(output.firstChild);
    choiceButtons.clear();
    screenTop = null;
  }
  const pending = [];
  for (const event of events) {
    if (event.type === 'clear') {
      for (let n = 0; n < event.count; n++) {
        if (pending.length) pending.pop();
        else if (!replace && output.lastChild) removeRow(output.lastChild);
        else break; // replace mode: leftover CLEARLINE targeted the old screen we already dropped
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
  if (replace) window.scrollTo(0, 0);
  else if (follow) scrollBottom();
}
function nearBottom() { return (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 80; }
function scrollBottom() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = null; window.scrollTo(0, document.documentElement.scrollHeight); });
}

function armLiveButtons() {
  choiceButtons.clear();
  for (const button of output.querySelectorAll('button')) {
    choiceButtons.add(button);
    button.disabled = false;
  }
}
function controls(enabled) {
  const pause = enabled && waiting?.type === 'wait';
  $('#continue').hidden = !pause; $('#continue').disabled = !pause;
  submit.textContent = pause ? '계속 ▶' : '전송';
  submit.disabled = !enabled; input.disabled = !enabled;
  for (const b of choiceButtons) b.disabled = !enabled;
}
function endChoice() { waiting = null; probe.waiting = null; controls(false); }
function send(value) {
  if (!waiting || !ws || ws.readyState !== WebSocket.OPEN) {
    notice.textContent = !waiting ? '입력 대기 아님 · 「새 세션」을 누르세요' : '연결 끊김';
    return;
  }
  if (waiting.type === 'wait') value = '';
  if (waiting.type !== 'wait' && waiting.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
    notice.textContent = '정수를 입력하세요.'; return;
  }
  notice.textContent = `전송:${value}`;
  followNext = true; screenTop = null;
  redrawBuffer = [];
  const id = waiting.id;
  endChoice(); state('실행 중');
  ws.send(JSON.stringify({ type: 'input', id, value }));
}

function onMessage(raw) {
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  switch (msg.type) {
    case 'session': {
      sessionId = msg.id; saveSessionId(sessionId);
      probe.resumed = msg.resumed;
      conn.textContent = msg.resumed ? '연결됨 · 이어서 진행' : '연결됨 · 새 세션';
      if (msg.resumed && output.childElementCount === 0) {
        try { localStorage.removeItem(STORE_KEY); } catch {}
        sessionId = null;
        notice.textContent = '빈 화면 resume → 새 세션';
        manualClose = true; try { ws.close(); } catch {}
        manualClose = false; connect();
        break;
      }
      if (msg.resumed) ws.send(JSON.stringify({ type: 'resume' }));
      else ws.send(JSON.stringify({ type: 'start' }));
      break;
    }
    case 'events':
      if (msg.id > lastBatch) {
        if (redrawBuffer) redrawBuffer.push(...msg.events);
        else renderBatch(msg.events);
        lastBatch = msg.id;
      }
      ws.send(JSON.stringify({ type: 'rendered', id: msg.id }));
      break;
    case 'running':
      if (waiting?.id === msg.id) { endChoice(); followNext = true; screenTop = null; redrawBuffer = []; }
      state('실행 중');
      break;
    case 'waiting':
      ws.send(JSON.stringify({ type: 'waiting-ack', id: msg.id }));
      if (waiting && waiting.id === msg.id) {
        armLiveButtons(); controls(true); state('입력 대기'); break;
      }
      if (waiting && msg.id < waiting.id) break;
      if (redrawBuffer) {
        if (redrawBuffer.length) renderBatch(redrawBuffer, { replace: true });
        redrawBuffer = null;
      }
      waiting = { ...msg.event, id: msg.id, deadline: msg.deadline };
      probe.waiting = { id: msg.id, type: waiting.type };
      armLiveButtons();
      controls(true); epoch++;
      input.inputMode = msg.event.numeric ? 'numeric' : 'text';
      input.placeholder = msg.event.type === 'wait' ? '계속 ▶' : '번호 입력 또는 버튼';
      notice.textContent = `대기#${msg.id} 버튼${choiceButtons.size}개`;
      if (msg.event.type === 'wait') notice.textContent = '계속 ▶ 를 누르세요';
      else if (msg.event.numeric && choiceButtons.size === 0) {
        notice.textContent = '숫자 입력 · 아래 창에 넣고 전송';
        try { input.focus({ preventScroll: true }); } catch { try { input.focus(); } catch {} }
      }
      followNext = false;
      state('입력 대기');
      break;
    case 'saved':
      probe.saved.push(msg.key); notice.textContent = '저장: ' + msg.key;
      break;
    case 'ended':
      probe.ended = true; endChoice(); state('종료됨');
      try { localStorage.removeItem(STORE_KEY); } catch {}
      break;
    case 'error':
      probe.error = msg.error; errorEl.textContent = JSON.stringify(msg.error, null, 2);
      endChoice(); state('오류');
      break;
  }
}

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

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resume' }));
  else if (!probe.ended) connect();
});

output.addEventListener('click', event => {
  const button = event.target.closest?.('button');
  if (button && output.contains(button)) {
    if (!waiting) { notice.textContent = '대기 아님'; return; }
    button.disabled = false;
    choiceButtons.add(button);
    send(button.dataset.value);
    return;
  }
  if (!waiting) return;
  const m = String(event.target?.textContent || '').match(/\[\s*(\d+)\s*\]/);
  if (m) send(m[1]);
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
    armLiveButtons(); controls(!!waiting);
    notice.textContent = '복구 시도';
  } else connect();
});
$('#fresh')?.addEventListener('click', () => {
  try { localStorage.removeItem(STORE_KEY); } catch {}
  const u = new URL(location.href);
  u.searchParams.set('fresh', '1');
  u.searchParams.set('v', BUILD);
  location.href = u.toString();
});

controls(false);
connect();
