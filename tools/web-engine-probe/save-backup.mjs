// This backup format is for this web engine, not Emuera binary .sav files.
export const GAME_DB = 'era-game-eraTHYMKR-erajs-v1';
export const SAVE_LOCK = GAME_DB + ':session';
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const MAX_JSON_BYTES = 256 * 1024 * 1024;
const identity = { game: 'eraTHYMKR', engine: 'eraJS', profile: 'erajs-json-v1', code: 890016222, version: 3210 };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const bytes = text => new TextEncoder().encode(text);
function require(condition, message) { if (!condition) throw new Error(message); }
export async function withSaveLock(operation) {
  require(navigator.locks, '저장 보호를 지원하는 최신 Safari/브라우저가 필요합니다.');
  return navigator.locks.request(SAVE_LOCK, { ifAvailable: true }, lock => {
    require(lock, '다른 탭에서 게임 또는 백업이 실행 중입니다. 저장 후 다른 실행기를 닫으세요.');
    return operation();
  });
}
async function digest(text) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(text)))].map(n => n.toString(16).padStart(2, '0')).join('');
}
function variables(value, depth = 0) {
  if (typeof value === 'string') return true;
  return depth < 4 && Array.isArray(value) && value.every(item => variables(item, depth + 1));
}
function variableMap(value) {
  return record(value) && Object.entries(value).every(([key, item]) => /^[A-Z_][A-Z0-9_]*$/i.test(key) && !['__proto__', 'constructor', 'prototype'].includes(key) && variables(item));
}
function validateEntries(entries) {
  require(Array.isArray(entries) && entries.length > 0 && entries.length <= 1001, '비어 있거나 저장 개수가 잘못된 백업입니다.');
  const seen = new Set();
  for (const entry of entries) {
    require(Array.isArray(entry) && entry.length === 2, '저장 항목 형식 오류');
    const [key, value] = entry;
    require(typeof key === 'string' && /^(global|save\d{2,6})\.sav$/.test(key) && !seen.has(key), '저장 파일 이름이 잘못되었거나 중복됩니다.');
    seen.add(key);
    require(typeof value === 'string' && value.length <= MAX_JSON_BYTES, '저장 내용 형식 오류');
    let save;
    try { save = JSON.parse(value); } catch { throw new Error('저장 내용이 손상되었습니다.'); }
    require(record(save) && save.code === identity.code && save.version === identity.version, '다른 게임 또는 지원하지 않는 게임 버전의 저장입니다.');
    const data = save.data;
    if (key === 'global.sav') {
      require(variableMap(data) && Array.isArray(data.GLOBAL) && Array.isArray(data.GLOBALS), '공통 저장 내용 형식 오류');
    } else {
      require(record(data) && typeof data.comment === 'string' && Array.isArray(data.characters) && data.characters.every(variableMap) && variableMap(data.variables), '슬롯 저장 내용 형식 오류');
    }
  }
  return entries;
}
export async function encodeBackup(entries) {
  validateEntries(entries);
  const payload = { ...identity, createdAt: new Date().toISOString(), entries };
  const text = JSON.stringify({ format: 'era-web-save-backup', schema: 1, payload, sha256: await digest(JSON.stringify(payload)) });
  require(bytes(text).length <= MAX_JSON_BYTES, '압축 전 백업이 256 MiB를 초과합니다.');
  return text;
}
export async function decodeBackup(text) {
  require(typeof text === 'string' && bytes(text).length <= MAX_JSON_BYTES, '압축 전 백업이 256 MiB를 초과합니다.');
  let backup;
  try { backup = JSON.parse(text); } catch { throw new Error('JSON 백업 파일이 아니거나 손상되었습니다.'); }
  require(record(backup) && backup.format === 'era-web-save-backup' && backup.schema === 1 && record(backup.payload), '지원하지 않는 백업 형식입니다. PC .sav 파일은 가져올 수 없습니다.');
  require(Object.entries(identity).every(([key, value]) => backup.payload[key] === value), '다른 게임·엔진 또는 버전의 백업입니다.');
  require(typeof backup.payload.createdAt === 'string' && Number.isFinite(Date.parse(backup.payload.createdAt)), '백업 날짜 오류');
  require(typeof backup.sha256 === 'string' && await digest(JSON.stringify(backup.payload)) === backup.sha256, '백업 무결성 검사 실패: 파일이 손상되거나 변경되었습니다.');
  validateEntries(backup.payload.entries);
  return backup.payload;
}
export async function packBackup(entries) {
  require(typeof CompressionStream === 'function', '압축 백업에는 iOS 16.4 이상의 Safari가 필요합니다.');
  const text = await encodeBackup(entries);
  const blob = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
  require(blob.size <= MAX_BACKUP_BYTES, '압축 백업이 64 MiB를 초과합니다.');
  return blob;
}
export async function unpackBackup(file) {
  require(file.size <= MAX_BACKUP_BYTES, '파일 크기가 64 MiB를 초과합니다.');
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] !== 31 || head[1] !== 139) return decodeBackup(await file.text());
  require(typeof DecompressionStream === 'function', '압축 복원에는 iOS 16.4 이상의 Safari가 필요합니다.');
  const reader = file.stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      require(size <= MAX_JSON_BYTES, '압축 해제 크기가 256 MiB를 초과합니다.');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  return decodeBackup(await new Blob(chunks).text());
}
