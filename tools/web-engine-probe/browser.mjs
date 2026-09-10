import './pwa.mjs';
import { withSaveLock } from './save-backup.mjs';
import { setupBackup } from './backup-ui.mjs';
import { createRuntimeTrace, describeTrace } from './runtime-trace.mjs';
const $ = selector => document.querySelector(selector);
let trace = createRuntimeTrace();
function showPrevious() {
  $('#previous-run').textContent = '직전 실행: ' + describeTrace(trace.previous);
}
function recordPhase(phase, key) {
  const record = trace.record(phase, key);
  $('#current-run').textContent = '현재 실행: ' + describeTrace(record) +
    (trace.available ? '' : ' · 진단 기록 보관 불가 (게임 저장과 별개)');
}
showPrevious();
const output = $('#output'), input = $('#input'), submit = $('#submit'), status = $('#status');
let worker, waiting = null, watchdog, countdown, mode;
const choiceButtons = new Set();
// Weak keys do not keep pruned rows alive; no subtree search is needed when trimming.
const rowButtons = new WeakMap();
let starting = false, releaseSession;
const backup = setupBackup(() => Boolean(worker) || starting);
let epoch = 0;
let composing = false;
let followNext = false;
let following = true, scrollFrame = null, composerHeight;
const composer = $('#composer'), main = $('main');
function nearLatest() {
  return main.getBoundingClientRect().bottom - composer.getBoundingClientRect().top < 80;
}
function latest() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    // ResizeObserver maintains the dock height; don't measure it again for every batch.
    following = true;
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
}
function measureComposer() {
  const height = composer.getBoundingClientRect().height;
  if (height === composerHeight) return;
  composerHeight = height;
  document.documentElement.style.setProperty('--composer-height', `${height}px`);
}
new ResizeObserver(measureComposer).observe(composer);
// Scrolling/viewport changes invalidate the follow state, not each line or Worker batch.
window.addEventListener('scroll', () => { following = nearLatest(); }, { passive: true });
function state(text) { status.textContent = text; }
function controls(enabled) {
  const pause = enabled && waiting?.type === 'wait';
  $('#continue').hidden = !pause;
  $('#continue').disabled = !pause;
  submit.textContent = pause ? '계속 ▶' : '전송';
  submit.disabled = !enabled;
  input.disabled = !enabled;
  for (const button of choiceButtons) button.disabled = !enabled;
}
function endChoice() {
  clearInterval(countdown);
  waiting = null; controls(false); choiceButtons.clear();
}
function stop(text = '중지됨 — 저장 중 중지한 경우 마지막 저장 완료 여부를 확인하세요', phase = 'stopped') {
  if (worker) recordPhase(phase);
  worker?.terminate(); worker = null; endChoice();
  releaseSession?.(); releaseSession = null;
  backup.update();
  clearTimeout(watchdog); controls(false); state(text);
  followNext = false;
  cancelAnimationFrame(scrollFrame); scrollFrame = null;
}
$('#latest').addEventListener('click', latest);
// Keep the composer above iOS's on-screen keyboard without forcing focus/zoom.
function viewport() {
  const follow = following = nearLatest();
  const view = window.visualViewport;
  document.documentElement.style.setProperty('--keyboard', `${Math.max(0, innerHeight - (view?.height ?? innerHeight) - (view?.offsetTop ?? 0))}px`);
  measureComposer();
  if (follow) latest();
}
window.visualViewport?.addEventListener('resize', viewport);
window.visualViewport?.addEventListener('scroll', viewport);
window.addEventListener('resize', viewport);
viewport();
function watch() {
  clearTimeout(watchdog);
  watchdog = setTimeout(() => stop('실행 시간 한도 초과 (60초). 세션을 다시 시작하세요.'), 60000);
}
function send(value) {
  if (!waiting || !worker) return;
  if (waiting.type === 'wait') value = '';
  if (waiting.type !== 'wait' && waiting.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
    $('#notice').textContent = '정수를 입력하세요. 이 후보 엔진의 정밀도 결함 때문에 안전 범위 밖 숫자는 거절합니다.';
    return;
  }
  $('#notice').textContent = '';
  // A deliberate input advances the view, even after choosing an older/top button.
  followNext = true;
  const id = waiting.id;
  endChoice(); state('실행 중'); watch();
  recordPhase('running');
  worker.postMessage({ type: 'input', id, value });
}
output.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button && !button.disabled && choiceButtons.has(button)) send(button.dataset.value);
});
function removeRow(row) {
  const buttons = rowButtons.get(row);
  if (buttons) for (const button of buttons) choiceButtons.delete(button);
  row.remove();
}
function renderBatch(events) {
  const follow = followNext || following;
  // Fold temporary output before allocating DOM nodes. CLEARLINE still reaches older
  // batches, and the 2,000-row history limit is applied only after the complete batch.
  const pending = [];
  for (const event of events) {
    if (event.type === 'clear') {
      for (let n = 0; n < event.count; n++) {
        if (pending.length) pending.pop();
        else if (output.lastChild) removeRow(output.lastChild);
        else break;
      }
    } else if (event.type === 'content' || event.type === 'line') pending.push(event);
    else $('#notice').textContent = '미지원 출력 이벤트: ' + event.type;
  }
  const fragment = document.createDocumentFragment();
  for (const event of pending) render(event, fragment);
  output.append(fragment);
  while (output.childElementCount > 2000) removeRow(output.firstChild);
  if (follow) latest();
}
function applyStyle(node, style) {
  style ??= {};
  if (/^[\da-f]{6}$/i.test(style.color)) node.style.color = '#' + style.color;
  if (style.bold) node.style.fontWeight = 'bold';
  if (style.italic) node.style.fontStyle = 'italic';
  if (style.underline || style.strike) node.style.textDecoration =
    style.underline ? (style.strike ? 'underline line-through' : 'underline') : 'line-through';
}
function render(event, fragment) {
  const row = document.createElement('div');
  row.className = 'game-line';
  if (event.type === 'content') {
    if (event.align === 'CENTER' || event.align === 'RIGHT') row.style.textAlign = event.align.toLowerCase();
    if (event.children.length === 1 && event.children[0].type === 'string') {
      // The engine already merges adjacent strings of the same style. Keep a single
      // text run directly in its row (including its color), without a redundant span.
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
function timedNotice() {
  if (waiting?.type !== 'tinput') return;
  const seconds = Math.max(0, (waiting.deadline - Date.now()) / 1000);
  $('#notice').textContent = waiting.countdown
    ? `제한시간 ${seconds.toFixed(1)}초 — 시간이 끝나면 게임의 기본 선택으로 진행합니다.`
    : '제한시간 입력 — 시간이 끝나면 게임의 기본 선택으로 진행합니다.';
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && worker) { timedNotice(); worker.postMessage({ type: 'resume' }); }
});
async function start(selected, game) {
  if (starting || backup.isBusy()) return;
  stop(); starting = true; backup.update();
  try {
    await withSaveLock(() => new Promise(resolve => {
      releaseSession = resolve;
      try { launch(selected, game); } catch (error) { stop('실패: ' + error.message); }
      starting = false; backup.update();
    }));
  } catch (error) { state(error.message); }
  finally { starting = false; backup.update(); }
}
function launch(selected, game) {
  mode = selected; epoch = 0;
  trace = createRuntimeTrace(undefined, mode); showPrevious(); recordPhase('start');
  followNext = true; following = true;
  output.replaceChildren(); $('#error').textContent = ''; $('#notice').textContent = '';
  $('#saved').textContent = '이번 세션 저장 완료 기록 없음';
  $('#session').textContent = mode === 'game' ? ('실제 게임 · ' + (game?.label ?? 'eraTHYMKR') + ' / eraJS 후보') : '독립 입력·저장 시험';
  state('파일 로딩 / 컴파일 중');
  const current = worker = new Worker('./engine-worker.js', { type: 'module' });
  watch();
  current.onerror = event => { if (worker === current) { $('#error').textContent = event.message; stop('실패', 'error'); } };
  current.onmessage = ({ data }) => {
    if (worker !== current) return;
    if (data.type === 'save-progress') {
      recordPhase(data.phase, data.key);
      current.postMessage({ type: 'progress-recorded', id: data.id });
      watch();
    }
    if (data.type === 'events') {
      renderBatch(data.events);
      current.postMessage({ type: 'rendered', id: data.id });
      watch();
    }
    if (data.type === 'running') {
      if (waiting?.id === data.id) { endChoice(); followNext = true; }
      $('#notice').textContent = ''; state('실행 중'); watch();
      recordPhase('running');
    }
    if (data.type === 'waiting') {
      recordPhase('waiting');
      clearTimeout(watchdog); clearInterval(countdown);
      waiting = { ...data.event, id: data.id, deadline: data.deadline };
      // Buttons emitted since the last input belong to the current choice epoch.
      controls(true); epoch++;
      input.inputMode = data.event.numeric ? 'numeric' : 'text';
      input.placeholder = data.event.type === 'wait' ? '입력 없이 계속 ▶ 버튼을 누르세요' : '값을 입력하거나 선택지를 누르세요';
      status.dataset.stack = JSON.stringify(data.stack);
      status.dataset.waitType = data.event.type;
      status.dataset.requestId = String(data.id);
      $('#notice').textContent = data.event.type === 'wait' ? '멈춘 것이 아닙니다. 계속 ▶ 버튼을 누르면 다음으로 진행합니다.' : '';
      if (waiting.type === 'tinput') {
        timedNotice();
        if (waiting.countdown) countdown = setInterval(timedNotice, 100);
      }
      if (followNext) latest();
      followNext = false;
      state('입력 대기');
    }
    if (data.type === 'saved') $('#saved').textContent = '저장 완료: ' + data.key;
    if (data.type === 'ended') stop(mode === 'game' ? '게임 종료' : '시험 종료', 'ended');
    if (data.type === 'error') {
      $('#error').textContent = JSON.stringify(data.error, null, 2);
      stop('실패 — 엔진 호환성/저장 오류를 확인하세요', 'error');
    }
  };
  current.postMessage({ type: 'start', mode, bin: game?.bin, db: game?.db });
}
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
$('#game-start').addEventListener('click', () => start('game'));
$('#start').addEventListener('click', () => start('fixture'));
$('#stop').addEventListener('click', () => stop());
// Multi-game launcher: when the PWA build ships a games.json manifest, offer one button per
// game. Each starts with its own bundle and IndexedDB namespace so saves never mix. The probe
// server (no manifest) keeps the single default start button unchanged.
async function loadGames() {
  try {
    const response = await fetch('./games.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.games) && data.games.length ? data.games : null;
  } catch { return null; }
}
loadGames().then(games => {
  const menu = $('#game-menu');
  if (!games || !menu) return;
  menu.replaceChildren();
  for (const game of games) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'game-choice';
    button.dataset.game = game.id; button.textContent = '▶ ' + game.label;
    button.addEventListener('click', () => start('game', game));
    menu.append(button);
  }
});
controls(false);
