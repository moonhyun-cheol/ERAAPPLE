import { createStore } from './browser-store.mjs';
import { createBackup, DEFAULT_TARGET, MAX_BACKUP_BYTES } from './save-backup.mjs';

// Per-game backup: each game has its own IndexedDB namespace and identity (code/version), so a
// backup is always taken/restored against the game chosen in the selector. Without a games.json
// manifest (probe server) it falls back to the single default (root) game and hides the selector.
export function setupBackup(isRunning) {
  const $ = selector => document.querySelector(selector);
  let busy = false, downloadURL, sharedFile;
  let targets = [DEFAULT_TARGET];
  const select = $('#backup-game');
  const message = text => { $('#backup-status').textContent = text; };
  function currentTarget() {
    const id = select?.value;
    return targets.find(t => t.id === id) ?? targets[0];
  }
  function setGames(games) {
    if (Array.isArray(games) && games.length) {
      targets = games.map(g => ({ id: g.id, game: g.id, label: g.label, db: g.db, code: g.code, version: g.version }));
    }
    if (select) {
      select.replaceChildren();
      for (const t of targets) {
        const option = document.createElement('option');
        option.value = t.id; option.textContent = t.label ?? t.id;
        select.append(option);
      }
      select.hidden = targets.length <= 1;
    }
  }
  function update() {
    const disabled = busy || isRunning();
    for (const id of ['backup-export', 'backup-file', 'backup-restore', 'backup-game']) { const el = $('#' + id); if (el) el.disabled = disabled; }
    for (const id of ['game-start', 'start']) $('#' + id).disabled = busy;
  }
  async function operation(fn) {
    if (busy || isRunning()) { message('게임에서 저장 완료 후 실행 중지를 눌러주세요.'); return; }
    busy = true; update();
    const target = currentTarget();
    const backup = createBackup(target);
    try { await backup.withSaveLock(async () => {
      const store = createStore(backup.GAME_DB);
      try { await fn(store, backup, target); } finally { await store.close(); }
    }); } catch (error) { message('실패: ' + error.message + ' (기존 저장은 변경하지 않았습니다.)'); }
    finally { busy = false; update(); }
  }
  $('#backup-export').addEventListener('click', () => operation(async (store, backup, target) => {
    message(`백업 준비 중… (${target.label ?? target.id})`);
    const blob = await backup.packBackup(await store.entries());
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    const name = `${target.id}-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`;
    sharedFile = new File([blob], name, { type: 'application/gzip' });
    downloadURL = URL.createObjectURL(sharedFile);
    const link = $('#backup-download');
    link.href = downloadURL; link.download = name; link.hidden = false;
    $('#backup-share').hidden = !navigator.canShare?.({ files: [sharedFile] });
    message(`백업 준비됨 (${target.label ?? target.id}). 아래 파일 다운로드 또는 공유 → 파일에 저장을 누르세요. 기기에 파일이 생겼는지 확인하세요.`);
  }));
  $('#backup-share').addEventListener('click', async () => {
    try { await navigator.share({ files: [sharedFile], title: (currentTarget().label ?? currentTarget().id) + ' 세이브 백업' }); }
    catch (error) { message(error.name === 'AbortError' ? '공유를 취소했습니다. 다운로드로 다시 저장할 수 있습니다.' : '공유 실패. 파일 다운로드를 이용하세요.'); }
  });
  $('#backup-restore').addEventListener('click', () => operation(async (store, backup, target) => {
    const file = $('#backup-file').files[0];
    if (!file) throw new Error('먼저 백업 JSON 파일을 선택하세요.');
    if (file.size > MAX_BACKUP_BYTES) throw new Error('파일 크기가 64 MiB를 초과합니다.');
    message('백업 검사 중…');
    const data = await backup.unpackBackup(file);
    if (!window.confirm(`대상 게임: ${target.label ?? target.id}\n백업 날짜: ${data.createdAt}\n저장 파일 ${data.entries.length}개로 이 게임의 모든 슬롯과 공통 저장을 교체합니다.\n현재 저장을 먼저 백업했나요? 계속할까요?`)) {
      message('복원 취소 — 기존 저장을 유지했습니다.'); return;
    }
    await store.replaceAll(data.entries);
    $('#backup-file').value = '';
    message(`복원 완료: ${data.entries.length}개 (${target.label ?? target.id}). 실제 게임 시작 → 불러오기를 선택하세요.`);
  }));
  setGames(targets);
  update();
  return { update, isBusy: () => busy, setGames };
}
