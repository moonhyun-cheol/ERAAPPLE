// Small, local-only breadcrumb; not a crash detector or a replacement for saves.
export const TRACE_KEY = 'era-runtime-trace-v1:';
const phases = { start: '로딩 / 컴파일', running: '게임 처리 중', waiting: '입력 대기',
  serialize: '저장 데이터 생성 중', writing: '저장소 기록 중', committed: '저장 완료',
  stopped: '사용자/실행기 중지', ended: '게임 종료', error: '실행 오류' };
export function createRuntimeTrace(storage = () => localStorage, mode = 'game') {
  const key = TRACE_KEY + mode;
  let available = true, current = null;
  function read() {
    try {
      const raw = storage().getItem(key);
      if (!raw || raw.length > 2048) return null;
      const record = JSON.parse(raw);
      return record?.schema === 1 && phases[record.phase] && Number.isFinite(record.at) ? record : null;
    } catch { available = false; return null; }
  }
  const previous = read();
  return {
    previous,
    get available() { return available; },
    record(phase, file) {
      if (!phases[phase]) return current;
      const now = Date.now();
      current = { schema: 1, phase, at: now, save: current?.save ?? null };
      if (['serialize', 'writing', 'committed'].includes(phase)) {
        current.save = { phase, key: typeof file === 'string' ? file.slice(0, 40) : '', at: now };
      }
      try { storage().setItem(key, JSON.stringify(current)); available = true; }
      catch { available = false; } // Quota/private mode must never block gameplay or saving.
      return current;
    }
  };
}
export function describeTrace(record) {
  if (!record) return '이전 기록 없음';
  const when = new Date(record.at).toLocaleString();
  const save = record.save;
  return `${when} · ${phases[record.phase] ?? '알 수 없음'}` +
    (save && phases[save.phase] ? ` · ${String(save.key).slice(0, 40)}: ${phases[save.phase]}` : '');
}

// ACK is received only after the UI attempted its local record. Timeout is a
// fail-open diagnostic fallback, never a claim that a save has committed.
export function createProgressBridge(send, timeoutMs = 1500) {
  let sequence = 0;
  const pending = new Map();
  return {
    acknowledge(id) { pending.get(id)?.(); },
    report(progress) {
      return new Promise(resolve => {
        const id = ++sequence;
        const finish = () => { clearTimeout(timer); pending.delete(id); resolve(); };
        const timer = setTimeout(finish, timeoutMs);
        pending.set(id, finish);
        try { send({ type: 'save-progress', id, ...progress }); } catch { finish(); }
      });
    }
  };
}
