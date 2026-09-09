const button = document.querySelector('#offline-prepare');
const status = document.querySelector('#pwa-status');
const base = new URL('./', location.href).href;
let registration;
const watched = new WeakSet();
function show(text) { status.textContent = text; }
async function check() {
  const controller = navigator.serviceWorker.controller;
  if (!controller || registration?.scope !== base) return;
  try {
    const result = await new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error('캐시 확인 시간 초과')); }, 10000);
      channel.port1.onmessage = ({ data }) => { clearTimeout(timer); channel.port1.close(); resolve(data); };
      controller.postMessage({ type: 'offline-status' }, [channel.port2]);
    });
    show(result.ready ? `오프라인 준비됨 · ${result.release} · ${result.count}개 자산 (영구 보존 아님)` : '오프라인 파일이 누락되었습니다. 온라인에서 준비 버튼으로 복구하세요.');
    if (registration.waiting) show(status.textContent + ' · 업데이트 준비됨: 저장 후 모든 실행기 창을 닫고 다시 여세요.');
  } catch (error) { show('오프라인 확인 실패: ' + error.message); }
}
function watch(worker) {
  if (!worker || watched.has(worker)) return;
  watched.add(worker);
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      if (navigator.serviceWorker.controller) show('업데이트 준비됨. 현재 버전을 유지합니다. 저장 후 모든 실행기 창을 닫고 다시 여세요.');
      else show('오프라인 자산 설치 완료 · 활성화 중');
    }
    if (worker.state === 'activated') void check();
    if (worker.state === 'redundant') show('다운로드/무결성/저장 공간 문제로 준비 실패. 기존 캐시와 세이브는 유지됩니다. 온라인에서 다시 시도하세요.');
  });
}
if (document.documentElement.dataset.pwa !== 'true') {
  show('현재는 개발용 서버입니다. iPhone용은 build:pwa의 정적 배포본을 사용하세요.');
} else if (!isSecureContext || !('serviceWorker' in navigator) || !('caches' in window)) {
  show('오프라인 기능에는 HTTPS와 Service Worker 지원이 필요합니다. iPhone의 LAN HTTP 주소는 지원하지 않습니다.');
} else {
  button.disabled = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => void check());
  window.addEventListener('pageshow', () => void check());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
  navigator.serviceWorker.getRegistration(base).then(value => {
    if (value?.scope === base) { registration = value; watch(value.installing); void check(); }
    if (!navigator.serviceWorker.controller) show('미준비: 홈 화면 앱에서 준비 버튼을 누르세요. 최초 다운로드에는 인터넷과 저장 공간이 필요합니다.');
  }).catch(error => show('PWA 확인 실패: ' + error.message));
  button.addEventListener('click', async () => {
    button.disabled = true;
    show('다운로드·무결성 확인 중… 완료될 때까지 이 화면을 유지하세요.');
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      registration.onupdatefound = () => watch(registration.installing);
      watch(registration.installing);
      await registration.update();
      // Repair only this version's missing cache entries; never unregister or delete saves.
      if (navigator.serviceWorker.controller && !registration.installing && !registration.waiting) {
        await new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => { channel.port1.close(); reject(new Error('복구 시간 초과. 온라인에서 다시 시도하세요.')); }, 180000);
          channel.port1.onmessage = ({ data }) => { clearTimeout(timer); channel.port1.close(); data.error ? reject(new Error(data.error)) : resolve(); };
          navigator.serviceWorker.controller.postMessage({ type: 'repair-cache' }, [channel.port2]);
        });
      }
      if (!registration.installing) await check();
    } catch (error) { show('오프라인 준비 실패 (기존 저장 유지): ' + error.message); }
    finally { button.disabled = false; }
  });
}