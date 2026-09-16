import { compile } from '../tools/web-engine-probe/dist/engine.mjs';
import { loadGameSource } from './game-source.mjs';
import { createEngineSession } from './engine-session.mjs';
import { fileURLToPath } from 'node:url';

const gameDir = fileURLToPath(new URL('../에라마왕 개조판 1.28', import.meta.url));
const { files } = await loadGameSource(gameDir);
const posts = [];
let session;
session = createEngineSession({
  compile, source: files, store: { get() {}, set() {} },
  getTime: () => 1700000000000, getFont: () => false,
  post: m => {
    posts.push(structuredClone(m));
    if (m.type === 'events') queueMicrotask(() => session.handle({ type: 'rendered', id: m.id }));
    if (m.type === 'waiting') queueMicrotask(() => session.handle({ type: 'waiting-ack', id: m.id }));
  },
  seed: 1
});
await session.handle({ type: 'start' });
await session.settled();

const NAME = 'ㅅㅎ';
const AVOID = /LOAD|불러|HELP|도움|설명|돌아가|이전|다음/i;
const CONFIRM = /결정|確定|확정|이대로|완료|시작|決定/;
function screenText() {
  return posts.filter(p => p.type === 'events').flatMap(p => p.events || [])
    .filter(e => e.type === 'content')
    .map(e => (e.children || []).map(c => c.text || '').join('')).join('\n');
}
function parseChoices(text) {
  const pairs = [...text.matchAll(/\[\s*(\d+)\s*\]\s*([^\[\n]*)/g)].map(m => ({ n: +m[1], label: m[2].trim() }));
  const seen = new Map();
  for (const p of pairs) if (!seen.has(p.n)) seen.set(p.n, p.label);
  return [...seen.entries()].map(([n, label]) => ({ n, label }));
}

let gave = false, shop = false, picked = false, visits = 0;
for (let i = 0; i < 200; i++) {
  await session.settled();
  const w = [...posts].reverse().find(p => p.type === 'waiting');
  if (!w) break;
  const t = screenText();
  const uniq = parseChoices(t);
  const isTitle = /NEW GAME/.test(t) && /LOAD GAME/.test(t) && !t.includes('[100]');
  const isCommandMenu = uniq.some(o => o.n === 107) && uniq.some(o => o.n === 200);
  const isShopList = /어둠의 상인|상품 목록|소지금/.test(t) && uniq.some(o => o.n === 0 || o.n === 24);

  let v;
  if (w.event.type === 'wait') v = '';
  else if (isTitle) v = '1';
  else if (isCommandMenu && !shop) { shop = true; v = '107'; console.log(i, 'ENTER SHOP'); }
  else if (shop && !picked && isShopList) {
    const item = uniq.find(o => o.n >= 24 && o.n < 90) ?? uniq.find(o => o.n >= 0 && o.n < 100 && ![997, 998, 999].includes(o.n));
    console.log(i, 'SHOP items', uniq.filter(o => o.n < 200).map(o => o.n), 'pick', item?.n);
    if (!item) { console.log(t.slice(-400)); process.exit(2); }
    picked = true; v = String(item.n);
  }   else if (picked) {
    const ask = /몇 개|구입합니까|구입했습니다/.test(t);
    console.log(i, 'AFTER PICK', { ask, type: w.event.type, choices: uniq.slice(0, 10) });
    console.log(t.slice(-400).replace(/\n/g, ' | '));
    session.dispose();
    process.exit(ask ? 0 : 1);
  } else if (/이름|명칭/.test(t) && !gave) { gave = true; v = NAME; }
  else {
    visits++;
    const confirm = uniq.find(o => CONFIRM.test(o.label));
    if (confirm) v = String(confirm.n);
    else if (visits > 3 && uniq.length) v = String(uniq.reduce((a, o) => o.n > a.n ? o : a).n);
    else { const good = uniq.find(o => !AVOID.test(o.label)); v = String(good ? good.n : (uniq[0]?.n ?? 0)); }
  }
  // Drop prior output so the next screenText is just this turn's redraw.
  posts.splice(0, posts.length);
  await session.handle({ type: 'input', id: w.id, value: v });
}
console.log('timeout', { shop, picked });
session.dispose();
process.exit(1);
