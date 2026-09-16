// Headless reproduction of the "shop/command menu tap does nothing" freeze, exercising the REAL
// thin client glue (server/public/client.mjs) on a minimal DOM, wired by a fake WebSocket straight
// into the REAL engine session (createEngineSession) running the REAL game source.
//
// Why: browser probe (shop-buy-probe.mjs) proved the ENGINE advances through shop-item selection
// (ok:true). So the freeze must live in the client render/enable/click glue that browser.mjs and
// client.mjs share. No real browser is available, so we drive the actual client module here and
// assert that on-screen menu buttons are clickable and that a click actually advances the session.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { loadGameSource } from './game-source.mjs';
import { createEngineSession } from './engine-session.mjs';

const gameDir = fileURLToPath(new URL('../에라마왕 개조판 1.28', import.meta.url));

// ---- minimal DOM ---------------------------------------------------------------------------------
let OUTPUT = null;
const DOC_ROOT = { scrollHeight: 0 };
class El {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.children = []; this.parent = null; this._isFragment = false;
    this.style = {}; this.dataset = {}; this._text = '';
    this.className = ''; this.id = '';
    this.disabled = false; this.hidden = false;
    this.type = ''; this.placeholder = ''; this.inputMode = ''; this.value = '';
    this.listeners = {};
  }
  get textContent() {
    return this.children.length ? this.children.map(c => c.textContent).join('') : this._text;
  }
  set textContent(v) { this.children = []; this._text = String(v); }
  append(...nodes) {
    for (const n of nodes) {
      if (n && n._isFragment) { for (const c of n.children) { c.parent = this; this.children.push(c); } n.children = []; }
      else { n.parent = this; this.children.push(n); this._text = ''; }
    }
  }
  remove() {
    if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; }
  }
  replaceWith(node) {
    if (!this.parent) return;
    const i = this.parent.children.indexOf(this);
    if (i < 0) return;
    node.parent = this.parent;
    this.parent.children[i] = node;
    this.parent = null;
  }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  get firstElementChild() { return this.children[0] || null; }
  get childElementCount() { return this.children.length; }
  get isConnected() { let n = this; while (n) { if (n === OUTPUT) return true; n = n.parent; } return false; }
  contains(node) {
    let n = node;
    while (n) { if (n === this) return true; n = n.parent; }
    return false;
  }
  _walk(acc) { for (const c of this.children) { acc.push(c); c._walk(acc); } return acc; }
  querySelectorAll(sel) {
    const all = this._walk([]);
    if (sel === '.game-line') return all.filter(e => e.className === 'game-line');
    if (sel === 'button') return all.filter(e => e.tagName === 'BUTTON');
    return [];
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) { let n = this; while (n) { if (sel === 'button' && n.tagName === 'BUTTON') return n; n = n.parent; } return null; }
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  dispatchEvent(ev) { ev.target ??= this; for (const fn of (this.listeners[ev.type] || [])) fn(ev); }
}

const registry = {};
function regEl(sel, tag) { const e = new El(tag); registry[sel] = e; return e; }
for (const id of ['#output', '#input', '#submit', '#status', '#notice', '#error', '#conn',
  '#composer', '#continue', '#latest', '#recover', '#fresh']) regEl(id, id === '#input' ? 'input' : 'div');
registry['form'] = new El('form');
OUTPUT = registry['#output'];

const documentShim = {
  querySelector: sel => registry[sel] || null,
  createElement: tag => new El(tag),
  createDocumentFragment: () => { const f = new El(); f._isFragment = true; return f; },
  documentElement: DOC_ROOT,
  addEventListener: () => {}, hidden: false
};

// ---- fake WebSocket wired to the real engine session --------------------------------------------
let currentWS = null;
const saveMap = new Map();
function makeStore() { return { get: k => saveMap.get(k), set: (k, v) => { saveMap.set(k, v); } }; }
let SOURCE = null;
class FakeWS {
  static OPEN = 1;
  constructor(url) {
    this.url = url; this.readyState = 0; this.listeners = {}; currentWS = this;
    this.session = createEngineSession({
      compile, source: SOURCE, store: makeStore(),
      getTime: () => 1700000000000, getFont: () => false,
      post: m => this._emit('message', { data: JSON.stringify(m) })
    });
    queueMicrotask(() => {
      this.readyState = 1; this._emit('open', {});
      this._emit('message', { data: JSON.stringify({ type: 'session', id: 'test-session', resumed: false }) });
    });
  }
  addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); }
  _emit(t, ev) { for (const fn of (this.listeners[t] || [])) fn(ev); }
  send(data) { const m = JSON.parse(data); Promise.resolve().then(() => { try { this.session.handle(m); } catch {} }); }
  close() { this.readyState = 3; try { this.session.dispose(); } catch {} this._emit('close', {}); }
}

// ---- global wiring (must be set before importing client.mjs) ------------------------------------
globalThis.document = documentShim;
globalThis.window = {
  innerHeight: 800, scrollY: 0, scrollTo: () => {},
  addEventListener: () => {}, requestAnimationFrame: cb => { queueMicrotask(cb); return 1; }
};
globalThis.requestAnimationFrame = cb => { queueMicrotask(cb); return 1; };
globalThis.location = { protocol: 'http:', host: '127.0.0.1:8787', search: '' };
const lsMap = new Map();
globalThis.localStorage = { getItem: k => (lsMap.has(k) ? lsMap.get(k) : null), setItem: (k, v) => lsMap.set(k, String(v)), removeItem: k => lsMap.delete(k) };
globalThis.WebSocket = FakeWS;

const tick = () => new Promise(r => setTimeout(r, 0));
async function drain() { for (let i = 0; i < 40; i++) { try { await currentWS?.session.settled(); } catch {} await tick(); } }

// ---- adaptive decider (mirrors shop-buy-probe.mjs) ----------------------------------------------
const NAME = 'ㅅㅎ';
const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전\s*페이지|다음\s*페이지/i;
const CONFIRM = /결정|確定|확정|이대로|완료|결정하기|시작하기|決定/;
function parseChoices(text) {
  const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
  const seen = new Map();
  for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
  return [...seen.entries()].map(([n, label]) => ({ n, label }));
}

test('thin client: shop/command menu buttons are clickable and a click advances the session', async () => {
  const loaded = await loadGameSource(gameDir);
  SOURCE = loaded.files;

  await import('./public/client.mjs');
  await drain();

  const input = registry['#input'];
  const form = registry['form'];
  const probe = globalThis.window.__thin;
  assert.ok(probe, 'client should expose window.__thin');

  const obs = { enteredShop: false, pickedItem: false, gaveQty: false, roundsAfterPick: 0,
    reachedShop: false, buttonFreeze: null, clickAdvanced: false, inputs: 0, decisions: [], clicks: [] };
  const fnVisits = new Map();
  let lastLen = 0;
  let peakDomButtons = 0, peakRows = 0, shopTurns = 0;

  for (let step = 0; step < 400; step++) {
    if (probe.ended || probe.error) break;
    if (!probe.waiting) { await drain(); if (!probe.waiting) break; }
    const cur = probe.waiting; if (!cur) break;
    obs.inputs++;

    const prevLen = lastLen;
    const rows = OUTPUT.querySelectorAll('.game-line');
    const newRows = rows.slice(Math.max(0, prevLen));
    const screen = newRows.map(r => r.textContent).join('\n');
    lastLen = rows.length;

    const uniq = parseChoices(screen);
    const isTitle = /NEW GAME/.test(screen) && /LOAD GAME/.test(screen) && !screen.includes('[100]');
    const isCommandMenu = uniq.some(o => o.n === 107) && uniq.some(o => o.n === 200);
    const isShopList = /어둠의 상인|상품 목록|소지금/.test(screen) && uniq.some(o => o.n === 0);

    let choice;
    if (cur.type === 'wait') choice = '';
    else if (isTitle) choice = '1';
    else if (isCommandMenu && !obs.enteredShop) { obs.enteredShop = true; choice = '107'; }
    else if (obs.enteredShop && !obs.pickedItem && isShopList) { obs.pickedItem = true; choice = '0'; }
    else if (obs.pickedItem) {
      obs.roundsAfterPick++;
      if (cur.type === 'tinput') choice = '';
      else if (!obs.gaveQty && cur.type === 'input') { obs.gaveQty = true; choice = '1'; }
      else { const good = uniq.find(o => !AVOID.test(o.label)); choice = good ? String(good.n) : (uniq[0] ? String(uniq[0].n) : '0'); }
    } else if (/이름|명칭/.test(screen) && /\(\s*5|자까지|５자/.test(screen)) choice = NAME;
    else {
      const confirm = uniq.find(o => CONFIRM.test(o.label));
      if (confirm) choice = String(confirm.n);
      else {
        const visits = (fnVisits.get('x') ?? 0) + 1; fnVisits.set('x', visits);
        if (visits > 3 && uniq.length) choice = String(uniq.reduce((a, o) => o.n > a.n ? o : a).n);
        else { const good = uniq.find(o => !AVOID.test(o.label)); choice = good ? String(good.n) : (uniq[0] ? String(uniq[0].n) : '0'); }
      }
    }

    const menuish = isCommandMenu || isShopList;
    // The user taps a button on the CURRENT screen (the rows just drawn), not stale scrollback.
    const buttons = newRows.flatMap(r => r.querySelectorAll('button'));
    const targetBtn = buttons.find(b => b.dataset.value === String(choice));
    const enabledCount = buttons.filter(b => !b.disabled).length;
    const domButtons = OUTPUT.querySelectorAll('button').length;
    peakDomButtons = Math.max(peakDomButtons, domButtons);
    peakRows = Math.max(peakRows, rows.length);
    if (isShopList) shopTurns++;

    if (menuish && cur.type !== 'wait') {
      obs.decisions.push({ step, kind: cur.type, choice, screenButtons: buttons.length, domButtons,
        enabled: enabledCount, hasTarget: !!targetBtn, targetDisabled: targetBtn ? targetBtn.disabled : null });
      if (buttons.length && enabledCount === 0 && obs.buttonFreeze === null)
        obs.buttonFreeze = { step, choice, buttons: buttons.length, note: 'menu drawn but ALL buttons disabled' };
    }

    const beforeId = cur.id;
    const clicked = !!(targetBtn && !targetBtn.disabled); // captured at gesture time (pre-advance)
    if (clicked) {
      OUTPUT.dispatchEvent({ type: 'click', target: targetBtn });
    } else if (targetBtn && targetBtn.disabled) {
      if (menuish && obs.buttonFreeze === null) obs.buttonFreeze = { step, choice, note: 'target button disabled' };
      input.value = String(choice); form.dispatchEvent({ type: 'submit', preventDefault() {} });
    } else {
      input.value = String(choice); form.dispatchEvent({ type: 'submit', preventDefault() {} });
    }
    await drain();

    if (menuish && cur.type !== 'wait') {
      const afterId = probe.waiting ? probe.waiting.id : null;
      const advanced = probe.ended || probe.error || !probe.waiting || afterId !== beforeId;
      obs.clicks.push({ step, choice, clicked, beforeId, afterId, advanced, ended: probe.ended });
      if (clicked && advanced) obs.clickAdvanced = true;
    }

    if (obs.pickedItem && obs.gaveQty && obs.roundsAfterPick >= 6) { obs.reachedShop = true; break; }
    if (obs.enteredShop && obs.pickedItem) obs.reachedShop = true;
  }

  console.log(JSON.stringify({
    enteredShop: obs.enteredShop, pickedItem: obs.pickedItem, gaveQty: obs.gaveQty,
    reachedShop: obs.reachedShop, clickAdvanced: obs.clickAdvanced, buttonFreeze: obs.buttonFreeze,
    inputs: obs.inputs, ended: probe.ended, error: probe.error,
    peakDomButtons, peakRows, shopTurns,
    clicks: obs.clicks.slice(0, 12), decisions: obs.decisions.slice(0, 4)
  }, null, 2));

  assert.equal(obs.enteredShop, true, 'should reach the command menu and enter the shop (107)');
  assert.equal(obs.buttonFreeze, null, 'menu buttons must not be all-disabled / un-clickable');
  assert.equal(obs.clickAdvanced, true, 'clicking a menu button must advance the session');
});
