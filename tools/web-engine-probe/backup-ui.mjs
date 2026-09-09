import { createStore } from './browser-store.mjs';
import { GAME_DB, MAX_BACKUP_BYTES, withSaveLock, packBackup, unpackBackup } from './save-backup.mjs';

export function setupBackup(isRunning) {
  const $ = selector => document.querySelector(selector);
  let busy = false, downloadURL, sharedFile;
  const message = text => { $('#backup-status').textContent = text; };
  function update() {
    const disabled = busy || isRunning();
    for (const id of ['backup-export', 'backup-file', 'backup-restore']) $('#' + id).disabled = disabled;
    for (const id of ['game-start', 'start']) $('#' + id).disabled = busy;
  }
  async function operation(fn) {
    if (busy || isRunning()) { message('게임에서 저장 완료 후 실행 중지를 눌러주세요.'); return; }
    busy = true; update();
    try { await withSaveLock(async () => {
      const store = createStore(GAME_DB);
      try { await fn(store); } finally { await store.close(); }
    }); } catch (error) { message('실패: ' + error.message + ' (기존 저장은 변경하지 않았습니다.)'); }
    finally { busy = false; update(); }
  }
  $('#backup-export').addEventListener('click', () => operation(async store => {
    message('백업 준비 중…');
    const blob = await packBackup(await store.entries());
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    const name = `eraTHYMKR-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json.gz`;
    sharedFile = new File([blob], name, { type: 'application/gzip' });
    downloadURL = URL.createObjectURL(sharedFile);
    const link = $('#backup-download');
    link.href = downloadURL; link.download = name; link.hidden = false;
    $('#backup-share').hidden = !navigator.canShare?.({ files: [sharedFile] });
    message('백업 준비됨. 아래 파일 다운로드 또는 공유 → 파일에 저장을 누르세요. 기기에 파일이 생겼는지 확인하세요.');
  }));
  $('#backup-share').addEventListener('click', async () => {
    try { await navigator.share({ files: [sharedFile], title: 'eraTHYMKR 세이브 백업' }); }
    catch (error) { message(error.name === 'AbortError' ? '공유를 취소했습니다. 다운로드로 다시 저장할 수 있습니다.' : '공유 실패. 파일 다운로드를 이용하세요.'); }
  });
  $('#backup-restore').addEventListener('click', () => operation(async store => {
    const file = $('#backup-file').files[0];
    if (!file) throw new Error('먼저 백업 JSON 파일을 선택하세요.');
    if (file.size > MAX_BACKUP_BYTES) throw new Error('파일 크기가 64 MiB를 초과합니다.');
    message('백업 검사 중…');
    const backup = await unpackBackup(file);
    if (!window.confirm(`백업 날짜: ${backup.createdAt}\n저장 파일 ${backup.entries.length}개로 이 게임의 모든 슬롯과 공통 저장을 교체합니다.\n현재 저장을 먼저 백업했나요? 계속할까요?`)) {
      message('복원 취소 — 기존 저장을 유지했습니다.'); return;
    }
    await store.replaceAll(backup.entries);
    $('#backup-file').value = '';
    message(`복원 완료: ${backup.entries.length}개. 실제 게임 시작 → 불러오기를 선택하세요.`);
  }));
  update();
  return { update, isBusy: () => busy };
}
