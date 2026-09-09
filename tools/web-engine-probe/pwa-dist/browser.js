// pwa.mjs
var button = document.querySelector("#offline-prepare");
var status = document.querySelector("#pwa-status");
var base = new URL("./", location.href).href;
var registration;
var watched = /* @__PURE__ */ new WeakSet();
function show(text) {
  status.textContent = text;
}
async function check() {
  const controller = navigator.serviceWorker.controller;
  if (!controller || registration?.scope !== base) return;
  try {
    const result = await new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => {
        channel.port1.close();
        reject(new Error("\uCE90\uC2DC \uD655\uC778 \uC2DC\uAC04 \uCD08\uACFC"));
      }, 1e4);
      channel.port1.onmessage = ({ data }) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(data);
      };
      controller.postMessage({ type: "offline-status" }, [channel.port2]);
    });
    show(result.ready ? `\uC624\uD504\uB77C\uC778 \uC900\uBE44\uB428 \xB7 ${result.release} \xB7 ${result.count}\uAC1C \uC790\uC0B0 (\uC601\uAD6C \uBCF4\uC874 \uC544\uB2D8)` : "\uC624\uD504\uB77C\uC778 \uD30C\uC77C\uC774 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC628\uB77C\uC778\uC5D0\uC11C \uC900\uBE44 \uBC84\uD2BC\uC73C\uB85C \uBCF5\uAD6C\uD558\uC138\uC694.");
    if (registration.waiting) show(status.textContent + " \xB7 \uC5C5\uB370\uC774\uD2B8 \uC900\uBE44\uB428: \uC800\uC7A5 \uD6C4 \uBAA8\uB4E0 \uC2E4\uD589\uAE30 \uCC3D\uC744 \uB2EB\uACE0 \uB2E4\uC2DC \uC5EC\uC138\uC694.");
  } catch (error) {
    show("\uC624\uD504\uB77C\uC778 \uD655\uC778 \uC2E4\uD328: " + error.message);
  }
}
function watch(worker2) {
  if (!worker2 || watched.has(worker2)) return;
  watched.add(worker2);
  worker2.addEventListener("statechange", () => {
    if (worker2.state === "installed") {
      if (navigator.serviceWorker.controller) show("\uC5C5\uB370\uC774\uD2B8 \uC900\uBE44\uB428. \uD604\uC7AC \uBC84\uC804\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4. \uC800\uC7A5 \uD6C4 \uBAA8\uB4E0 \uC2E4\uD589\uAE30 \uCC3D\uC744 \uB2EB\uACE0 \uB2E4\uC2DC \uC5EC\uC138\uC694.");
      else show("\uC624\uD504\uB77C\uC778 \uC790\uC0B0 \uC124\uCE58 \uC644\uB8CC \xB7 \uD65C\uC131\uD654 \uC911");
    }
    if (worker2.state === "activated") void check();
    if (worker2.state === "redundant") show("\uB2E4\uC6B4\uB85C\uB4DC/\uBB34\uACB0\uC131/\uC800\uC7A5 \uACF5\uAC04 \uBB38\uC81C\uB85C \uC900\uBE44 \uC2E4\uD328. \uAE30\uC874 \uCE90\uC2DC\uC640 \uC138\uC774\uBE0C\uB294 \uC720\uC9C0\uB429\uB2C8\uB2E4. \uC628\uB77C\uC778\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
  });
}
if (document.documentElement.dataset.pwa !== "true") {
  show("\uD604\uC7AC\uB294 \uAC1C\uBC1C\uC6A9 \uC11C\uBC84\uC785\uB2C8\uB2E4. iPhone\uC6A9\uC740 build:pwa\uC758 \uC815\uC801 \uBC30\uD3EC\uBCF8\uC744 \uC0AC\uC6A9\uD558\uC138\uC694.");
} else if (!isSecureContext || !("serviceWorker" in navigator) || !("caches" in window)) {
  show("\uC624\uD504\uB77C\uC778 \uAE30\uB2A5\uC5D0\uB294 HTTPS\uC640 Service Worker \uC9C0\uC6D0\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. iPhone\uC758 LAN HTTP \uC8FC\uC18C\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
} else {
  button.disabled = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => void check());
  window.addEventListener("pageshow", () => void check());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void check();
  });
  navigator.serviceWorker.getRegistration(base).then((value) => {
    if (value?.scope === base) {
      registration = value;
      watch(value.installing);
      void check();
    }
    if (!navigator.serviceWorker.controller) show("\uBBF8\uC900\uBE44: \uD648 \uD654\uBA74 \uC571\uC5D0\uC11C \uC900\uBE44 \uBC84\uD2BC\uC744 \uB204\uB974\uC138\uC694. \uCD5C\uCD08 \uB2E4\uC6B4\uB85C\uB4DC\uC5D0\uB294 \uC778\uD130\uB137\uACFC \uC800\uC7A5 \uACF5\uAC04\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
  }).catch((error) => show("PWA \uD655\uC778 \uC2E4\uD328: " + error.message));
  button.addEventListener("click", async () => {
    button.disabled = true;
    show("\uB2E4\uC6B4\uB85C\uB4DC\xB7\uBB34\uACB0\uC131 \uD655\uC778 \uC911\u2026 \uC644\uB8CC\uB420 \uB54C\uAE4C\uC9C0 \uC774 \uD654\uBA74\uC744 \uC720\uC9C0\uD558\uC138\uC694.");
    try {
      registration = await navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" });
      registration.onupdatefound = () => watch(registration.installing);
      watch(registration.installing);
      await registration.update();
      if (navigator.serviceWorker.controller && !registration.installing && !registration.waiting) {
        await new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => {
            channel.port1.close();
            reject(new Error("\uBCF5\uAD6C \uC2DC\uAC04 \uCD08\uACFC. \uC628\uB77C\uC778\uC5D0\uC11C \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694."));
          }, 18e4);
          channel.port1.onmessage = ({ data }) => {
            clearTimeout(timer);
            channel.port1.close();
            data.error ? reject(new Error(data.error)) : resolve();
          };
          navigator.serviceWorker.controller.postMessage({ type: "repair-cache" }, [channel.port2]);
        });
      }
      if (!registration.installing) await check();
    } catch (error) {
      show("\uC624\uD504\uB77C\uC778 \uC900\uBE44 \uC2E4\uD328 (\uAE30\uC874 \uC800\uC7A5 \uC720\uC9C0): " + error.message);
    } finally {
      button.disabled = false;
    }
  });
}

// save-backup.mjs
var GAME_DB = "era-game-eraTHYMKR-erajs-v1";
var SAVE_LOCK = GAME_DB + ":session";
var MAX_BACKUP_BYTES = 64 * 1024 * 1024;
var MAX_JSON_BYTES = 256 * 1024 * 1024;
var identity = { game: "eraTHYMKR", engine: "eraJS", profile: "erajs-json-v1", code: 890016222, version: 3210 };
var record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var bytes = (text) => new TextEncoder().encode(text);
function require2(condition, message) {
  if (!condition) throw new Error(message);
}
async function withSaveLock(operation) {
  require2(navigator.locks, "\uC800\uC7A5 \uBCF4\uD638\uB97C \uC9C0\uC6D0\uD558\uB294 \uCD5C\uC2E0 Safari/\uBE0C\uB77C\uC6B0\uC800\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  return navigator.locks.request(SAVE_LOCK, { ifAvailable: true }, (lock) => {
    require2(lock, "\uB2E4\uB978 \uD0ED\uC5D0\uC11C \uAC8C\uC784 \uB610\uB294 \uBC31\uC5C5\uC774 \uC2E4\uD589 \uC911\uC785\uB2C8\uB2E4. \uC800\uC7A5 \uD6C4 \uB2E4\uB978 \uC2E4\uD589\uAE30\uB97C \uB2EB\uC73C\uC138\uC694.");
    return operation();
  });
}
async function digest(text) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes(text)))].map((n) => n.toString(16).padStart(2, "0")).join("");
}
function variables(value, depth = 0) {
  if (typeof value === "string") return true;
  return depth < 4 && Array.isArray(value) && value.every((item) => variables(item, depth + 1));
}
function variableMap(value) {
  return record(value) && Object.entries(value).every(([key, item]) => /^[A-Z_][A-Z0-9_]*$/i.test(key) && !["__proto__", "constructor", "prototype"].includes(key) && variables(item));
}
function validateEntries(entries) {
  require2(Array.isArray(entries) && entries.length > 0 && entries.length <= 1001, "\uBE44\uC5B4 \uC788\uAC70\uB098 \uC800\uC7A5 \uAC1C\uC218\uAC00 \uC798\uBABB\uB41C \uBC31\uC5C5\uC785\uB2C8\uB2E4.");
  const seen = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    require2(Array.isArray(entry) && entry.length === 2, "\uC800\uC7A5 \uD56D\uBAA9 \uD615\uC2DD \uC624\uB958");
    const [key, value] = entry;
    require2(typeof key === "string" && /^(global|save\d{2,6})\.sav$/.test(key) && !seen.has(key), "\uC800\uC7A5 \uD30C\uC77C \uC774\uB984\uC774 \uC798\uBABB\uB418\uC5C8\uAC70\uB098 \uC911\uBCF5\uB429\uB2C8\uB2E4.");
    seen.add(key);
    require2(typeof value === "string" && value.length <= MAX_JSON_BYTES, "\uC800\uC7A5 \uB0B4\uC6A9 \uD615\uC2DD \uC624\uB958");
    let save;
    try {
      save = JSON.parse(value);
    } catch {
      throw new Error("\uC800\uC7A5 \uB0B4\uC6A9\uC774 \uC190\uC0C1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    }
    require2(record(save) && save.code === identity.code && save.version === identity.version, "\uB2E4\uB978 \uAC8C\uC784 \uB610\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAC8C\uC784 \uBC84\uC804\uC758 \uC800\uC7A5\uC785\uB2C8\uB2E4.");
    const data = save.data;
    if (key === "global.sav") {
      require2(variableMap(data) && Array.isArray(data.GLOBAL) && Array.isArray(data.GLOBALS), "\uACF5\uD1B5 \uC800\uC7A5 \uB0B4\uC6A9 \uD615\uC2DD \uC624\uB958");
    } else {
      require2(record(data) && typeof data.comment === "string" && Array.isArray(data.characters) && data.characters.every(variableMap) && variableMap(data.variables), "\uC2AC\uB86F \uC800\uC7A5 \uB0B4\uC6A9 \uD615\uC2DD \uC624\uB958");
    }
  }
  return entries;
}
async function encodeBackup(entries) {
  validateEntries(entries);
  const payload = { ...identity, createdAt: (/* @__PURE__ */ new Date()).toISOString(), entries };
  const text = JSON.stringify({ format: "era-web-save-backup", schema: 1, payload, sha256: await digest(JSON.stringify(payload)) });
  require2(bytes(text).length <= MAX_JSON_BYTES, "\uC555\uCD95 \uC804 \uBC31\uC5C5\uC774 256 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
  return text;
}
async function decodeBackup(text) {
  require2(typeof text === "string" && bytes(text).length <= MAX_JSON_BYTES, "\uC555\uCD95 \uC804 \uBC31\uC5C5\uC774 256 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
  let backup2;
  try {
    backup2 = JSON.parse(text);
  } catch {
    throw new Error("JSON \uBC31\uC5C5 \uD30C\uC77C\uC774 \uC544\uB2C8\uAC70\uB098 \uC190\uC0C1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  }
  require2(record(backup2) && backup2.format === "era-web-save-backup" && backup2.schema === 1 && record(backup2.payload), "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBC31\uC5C5 \uD615\uC2DD\uC785\uB2C8\uB2E4. PC .sav \uD30C\uC77C\uC740 \uAC00\uC838\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  require2(Object.entries(identity).every(([key, value]) => backup2.payload[key] === value), "\uB2E4\uB978 \uAC8C\uC784\xB7\uC5D4\uC9C4 \uB610\uB294 \uBC84\uC804\uC758 \uBC31\uC5C5\uC785\uB2C8\uB2E4.");
  require2(typeof backup2.payload.createdAt === "string" && Number.isFinite(Date.parse(backup2.payload.createdAt)), "\uBC31\uC5C5 \uB0A0\uC9DC \uC624\uB958");
  require2(typeof backup2.sha256 === "string" && await digest(JSON.stringify(backup2.payload)) === backup2.sha256, "\uBC31\uC5C5 \uBB34\uACB0\uC131 \uAC80\uC0AC \uC2E4\uD328: \uD30C\uC77C\uC774 \uC190\uC0C1\uB418\uAC70\uB098 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  validateEntries(backup2.payload.entries);
  return backup2.payload;
}
async function packBackup(entries) {
  require2(typeof CompressionStream === "function", "\uC555\uCD95 \uBC31\uC5C5\uC5D0\uB294 iOS 16.4 \uC774\uC0C1\uC758 Safari\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  const text = await encodeBackup(entries);
  const blob = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).blob();
  require2(blob.size <= MAX_BACKUP_BYTES, "\uC555\uCD95 \uBC31\uC5C5\uC774 64 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
  return blob;
}
async function unpackBackup(file) {
  require2(file.size <= MAX_BACKUP_BYTES, "\uD30C\uC77C \uD06C\uAE30\uAC00 64 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] !== 31 || head[1] !== 139) return decodeBackup(await file.text());
  require2(typeof DecompressionStream === "function", "\uC555\uCD95 \uBCF5\uC6D0\uC5D0\uB294 iOS 16.4 \uC774\uC0C1\uC758 Safari\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.");
  const reader = file.stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks = [];
  let size = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      require2(size <= MAX_JSON_BYTES, "\uC555\uCD95 \uD574\uC81C \uD06C\uAE30\uAC00 256 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {
    });
    throw error;
  }
  return decodeBackup(await new Blob(chunks).text());
}

// browser-store.mjs
function createStore(name = "era-engine-probe-v1") {
  const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("saves");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Probe database upgrade blocked"));
  });
  async function transact(mode2, operation) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("saves", mode2);
      const request = operation(tx.objectStore("saves"));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? request.error ?? new Error("Probe transaction aborted"));
      tx.onerror = () => {
      };
    });
  }
  return {
    get: (key) => transact("readonly", (objectStore) => objectStore.get(key)),
    set: (key, value) => transact("readwrite", (objectStore) => objectStore.put(value, key)),
    async entries() {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction("saves", "readonly"), store = tx.objectStore("saves");
        const keys = store.getAllKeys(), values = store.getAll();
        tx.oncomplete = () => resolve(keys.result.map((key, i) => [key, values.result[i]]));
        tx.onabort = () => reject(tx.error ?? new Error("Snapshot aborted"));
        tx.onerror = () => {
        };
      });
    },
    async replaceAll(entries) {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction("saves", "readwrite"), store = tx.objectStore("saves");
        let failure;
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(failure ?? tx.error ?? new Error("Restore aborted"));
        tx.onerror = () => {
        };
        try {
          store.clear();
          for (const [key, value] of entries) store.put(value, key);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      });
    },
    async close() {
      (await dbPromise).close();
    }
  };
}

// backup-ui.mjs
function setupBackup(isRunning) {
  const $2 = (selector) => document.querySelector(selector);
  let busy = false, downloadURL, sharedFile;
  const message = (text) => {
    $2("#backup-status").textContent = text;
  };
  function update() {
    const disabled = busy || isRunning();
    for (const id of ["backup-export", "backup-file", "backup-restore"]) $2("#" + id).disabled = disabled;
    for (const id of ["game-start", "start"]) $2("#" + id).disabled = busy;
  }
  async function operation(fn) {
    if (busy || isRunning()) {
      message("\uAC8C\uC784\uC5D0\uC11C \uC800\uC7A5 \uC644\uB8CC \uD6C4 \uC2E4\uD589 \uC911\uC9C0\uB97C \uB20C\uB7EC\uC8FC\uC138\uC694.");
      return;
    }
    busy = true;
    update();
    try {
      await withSaveLock(async () => {
        const store = createStore(GAME_DB);
        try {
          await fn(store);
        } finally {
          await store.close();
        }
      });
    } catch (error) {
      message("\uC2E4\uD328: " + error.message + " (\uAE30\uC874 \uC800\uC7A5\uC740 \uBCC0\uACBD\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.)");
    } finally {
      busy = false;
      update();
    }
  }
  $2("#backup-export").addEventListener("click", () => operation(async (store) => {
    message("\uBC31\uC5C5 \uC900\uBE44 \uC911\u2026");
    const blob = await packBackup(await store.entries());
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    const name = `eraTHYMKR-backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json.gz`;
    sharedFile = new File([blob], name, { type: "application/gzip" });
    downloadURL = URL.createObjectURL(sharedFile);
    const link = $2("#backup-download");
    link.href = downloadURL;
    link.download = name;
    link.hidden = false;
    $2("#backup-share").hidden = !navigator.canShare?.({ files: [sharedFile] });
    message("\uBC31\uC5C5 \uC900\uBE44\uB428. \uC544\uB798 \uD30C\uC77C \uB2E4\uC6B4\uB85C\uB4DC \uB610\uB294 \uACF5\uC720 \u2192 \uD30C\uC77C\uC5D0 \uC800\uC7A5\uC744 \uB204\uB974\uC138\uC694. \uAE30\uAE30\uC5D0 \uD30C\uC77C\uC774 \uC0DD\uACBC\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.");
  }));
  $2("#backup-share").addEventListener("click", async () => {
    try {
      await navigator.share({ files: [sharedFile], title: "eraTHYMKR \uC138\uC774\uBE0C \uBC31\uC5C5" });
    } catch (error) {
      message(error.name === "AbortError" ? "\uACF5\uC720\uB97C \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC6B4\uB85C\uB4DC\uB85C \uB2E4\uC2DC \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." : "\uACF5\uC720 \uC2E4\uD328. \uD30C\uC77C \uB2E4\uC6B4\uB85C\uB4DC\uB97C \uC774\uC6A9\uD558\uC138\uC694.");
    }
  });
  $2("#backup-restore").addEventListener("click", () => operation(async (store) => {
    const file = $2("#backup-file").files[0];
    if (!file) throw new Error("\uBA3C\uC800 \uBC31\uC5C5 JSON \uD30C\uC77C\uC744 \uC120\uD0DD\uD558\uC138\uC694.");
    if (file.size > MAX_BACKUP_BYTES) throw new Error("\uD30C\uC77C \uD06C\uAE30\uAC00 64 MiB\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.");
    message("\uBC31\uC5C5 \uAC80\uC0AC \uC911\u2026");
    const backup2 = await unpackBackup(file);
    if (!window.confirm(`\uBC31\uC5C5 \uB0A0\uC9DC: ${backup2.createdAt}
\uC800\uC7A5 \uD30C\uC77C ${backup2.entries.length}\uAC1C\uB85C \uC774 \uAC8C\uC784\uC758 \uBAA8\uB4E0 \uC2AC\uB86F\uACFC \uACF5\uD1B5 \uC800\uC7A5\uC744 \uAD50\uCCB4\uD569\uB2C8\uB2E4.
\uD604\uC7AC \uC800\uC7A5\uC744 \uBA3C\uC800 \uBC31\uC5C5\uD588\uB098\uC694? \uACC4\uC18D\uD560\uAE4C\uC694?`)) {
      message("\uBCF5\uC6D0 \uCDE8\uC18C \u2014 \uAE30\uC874 \uC800\uC7A5\uC744 \uC720\uC9C0\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }
    await store.replaceAll(backup2.entries);
    $2("#backup-file").value = "";
    message(`\uBCF5\uC6D0 \uC644\uB8CC: ${backup2.entries.length}\uAC1C. \uC2E4\uC81C \uAC8C\uC784 \uC2DC\uC791 \u2192 \uBD88\uB7EC\uC624\uAE30\uB97C \uC120\uD0DD\uD558\uC138\uC694.`);
  }));
  update();
  return { update, isBusy: () => busy };
}

// runtime-trace.mjs
var TRACE_KEY = "era-runtime-trace-v1:";
var phases = {
  start: "\uB85C\uB529 / \uCEF4\uD30C\uC77C",
  running: "\uAC8C\uC784 \uCC98\uB9AC \uC911",
  waiting: "\uC785\uB825 \uB300\uAE30",
  serialize: "\uC800\uC7A5 \uB370\uC774\uD130 \uC0DD\uC131 \uC911",
  writing: "\uC800\uC7A5\uC18C \uAE30\uB85D \uC911",
  committed: "\uC800\uC7A5 \uC644\uB8CC",
  stopped: "\uC0AC\uC6A9\uC790/\uC2E4\uD589\uAE30 \uC911\uC9C0",
  ended: "\uAC8C\uC784 \uC885\uB8CC",
  error: "\uC2E4\uD589 \uC624\uB958"
};
function createRuntimeTrace(storage = () => localStorage, mode2 = "game") {
  const key = TRACE_KEY + mode2;
  let available = true, current = null;
  function read() {
    try {
      const raw = storage().getItem(key);
      if (!raw || raw.length > 2048) return null;
      const record2 = JSON.parse(raw);
      return record2?.schema === 1 && phases[record2.phase] && Number.isFinite(record2.at) ? record2 : null;
    } catch {
      available = false;
      return null;
    }
  }
  const previous = read();
  return {
    previous,
    get available() {
      return available;
    },
    record(phase, file) {
      if (!phases[phase]) return current;
      const now = Date.now();
      current = { schema: 1, phase, at: now, save: current?.save ?? null };
      if (["serialize", "writing", "committed"].includes(phase)) {
        current.save = { phase, key: typeof file === "string" ? file.slice(0, 40) : "", at: now };
      }
      try {
        storage().setItem(key, JSON.stringify(current));
        available = true;
      } catch {
        available = false;
      }
      return current;
    }
  };
}
function describeTrace(record2) {
  if (!record2) return "\uC774\uC804 \uAE30\uB85D \uC5C6\uC74C";
  const when = new Date(record2.at).toLocaleString();
  const save = record2.save;
  return `${when} \xB7 ${phases[record2.phase] ?? "\uC54C \uC218 \uC5C6\uC74C"}` + (save && phases[save.phase] ? ` \xB7 ${String(save.key).slice(0, 40)}: ${phases[save.phase]}` : "");
}

// browser.mjs
var $ = (selector) => document.querySelector(selector);
var trace = createRuntimeTrace();
function showPrevious() {
  $("#previous-run").textContent = "\uC9C1\uC804 \uC2E4\uD589: " + describeTrace(trace.previous);
}
function recordPhase(phase, key) {
  const record2 = trace.record(phase, key);
  $("#current-run").textContent = "\uD604\uC7AC \uC2E4\uD589: " + describeTrace(record2) + (trace.available ? "" : " \xB7 \uC9C4\uB2E8 \uAE30\uB85D \uBCF4\uAD00 \uBD88\uAC00 (\uAC8C\uC784 \uC800\uC7A5\uACFC \uBCC4\uAC1C)");
}
showPrevious();
var output = $("#output");
var input = $("#input");
var submit = $("#submit");
var status2 = $("#status");
var worker;
var waiting = null;
var watchdog;
var countdown;
var mode;
var choiceButtons = /* @__PURE__ */ new Set();
var rowButtons = /* @__PURE__ */ new WeakMap();
var starting = false;
var releaseSession;
var backup = setupBackup(() => Boolean(worker) || starting);
var epoch = 0;
var composing = false;
var followNext = false;
var following = true;
var scrollFrame = null;
var composerHeight;
var composer = $("#composer");
var main = $("main");
function nearLatest() {
  return main.getBoundingClientRect().bottom - composer.getBoundingClientRect().top < 80;
}
function latest() {
  if (scrollFrame !== null) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    following = true;
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
}
function measureComposer() {
  const height = composer.getBoundingClientRect().height;
  if (height === composerHeight) return;
  composerHeight = height;
  document.documentElement.style.setProperty("--composer-height", `${height}px`);
}
new ResizeObserver(measureComposer).observe(composer);
window.addEventListener("scroll", () => {
  following = nearLatest();
}, { passive: true });
function state(text) {
  status2.textContent = text;
}
function controls(enabled) {
  const pause = enabled && waiting?.type === "wait";
  $("#continue").hidden = !pause;
  $("#continue").disabled = !pause;
  submit.textContent = pause ? "\uACC4\uC18D \u25B6" : "\uC804\uC1A1";
  submit.disabled = !enabled;
  input.disabled = !enabled;
  for (const button2 of choiceButtons) button2.disabled = !enabled;
}
function endChoice() {
  clearInterval(countdown);
  waiting = null;
  controls(false);
  choiceButtons.clear();
}
function stop(text = "\uC911\uC9C0\uB428 \u2014 \uC800\uC7A5 \uC911 \uC911\uC9C0\uD55C \uACBD\uC6B0 \uB9C8\uC9C0\uB9C9 \uC800\uC7A5 \uC644\uB8CC \uC5EC\uBD80\uB97C \uD655\uC778\uD558\uC138\uC694", phase = "stopped") {
  if (worker) recordPhase(phase);
  worker?.terminate();
  worker = null;
  endChoice();
  releaseSession?.();
  releaseSession = null;
  backup.update();
  clearTimeout(watchdog);
  controls(false);
  state(text);
  followNext = false;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = null;
}
$("#latest").addEventListener("click", latest);
function viewport() {
  const follow = following = nearLatest();
  const view = window.visualViewport;
  document.documentElement.style.setProperty("--keyboard", `${Math.max(0, innerHeight - (view?.height ?? innerHeight) - (view?.offsetTop ?? 0))}px`);
  measureComposer();
  if (follow) latest();
}
window.visualViewport?.addEventListener("resize", viewport);
window.visualViewport?.addEventListener("scroll", viewport);
window.addEventListener("resize", viewport);
viewport();
function watch2() {
  clearTimeout(watchdog);
  watchdog = setTimeout(() => stop("\uC2E4\uD589 \uC2DC\uAC04 \uD55C\uB3C4 \uCD08\uACFC (60\uCD08). \uC138\uC158\uC744 \uB2E4\uC2DC \uC2DC\uC791\uD558\uC138\uC694."), 6e4);
}
function send(value) {
  if (!waiting || !worker) return;
  if (waiting.type === "wait") value = "";
  if (waiting.type !== "wait" && waiting.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
    $("#notice").textContent = "\uC815\uC218\uB97C \uC785\uB825\uD558\uC138\uC694. \uC774 \uD6C4\uBCF4 \uC5D4\uC9C4\uC758 \uC815\uBC00\uB3C4 \uACB0\uD568 \uB54C\uBB38\uC5D0 \uC548\uC804 \uBC94\uC704 \uBC16 \uC22B\uC790\uB294 \uAC70\uC808\uD569\uB2C8\uB2E4.";
    return;
  }
  $("#notice").textContent = "";
  followNext = true;
  const id = waiting.id;
  endChoice();
  state("\uC2E4\uD589 \uC911");
  watch2();
  recordPhase("running");
  worker.postMessage({ type: "input", id, value });
}
output.addEventListener("click", (event) => {
  const button2 = event.target.closest("button");
  if (button2 && !button2.disabled && choiceButtons.has(button2)) send(button2.dataset.value);
});
function removeRow(row) {
  const buttons = rowButtons.get(row);
  if (buttons) for (const button2 of buttons) choiceButtons.delete(button2);
  row.remove();
}
function renderBatch(events) {
  const follow = followNext || following;
  const pending = [];
  for (const event of events) {
    if (event.type === "clear") {
      for (let n = 0; n < event.count; n++) {
        if (pending.length) pending.pop();
        else if (output.lastChild) removeRow(output.lastChild);
        else break;
      }
    } else if (event.type === "content" || event.type === "line") pending.push(event);
    else $("#notice").textContent = "\uBBF8\uC9C0\uC6D0 \uCD9C\uB825 \uC774\uBCA4\uD2B8: " + event.type;
  }
  const fragment = document.createDocumentFragment();
  for (const event of pending) render(event, fragment);
  output.append(fragment);
  while (output.childElementCount > 2e3) removeRow(output.firstChild);
  if (follow) latest();
}
function applyStyle(node, style) {
  style ??= {};
  if (/^[\da-f]{6}$/i.test(style.color)) node.style.color = "#" + style.color;
  if (style.bold) node.style.fontWeight = "bold";
  if (style.italic) node.style.fontStyle = "italic";
  if (style.underline || style.strike) node.style.textDecoration = style.underline ? style.strike ? "underline line-through" : "underline" : "line-through";
}
function render(event, fragment) {
  const row = document.createElement("div");
  row.className = "game-line";
  if (event.type === "content") {
    if (event.align === "CENTER" || event.align === "RIGHT") row.style.textAlign = event.align.toLowerCase();
    if (event.children.length === 1 && event.children[0].type === "string") {
      row.textContent = event.children[0].text;
      applyStyle(row, event.children[0].style);
    } else {
      const buttons = [];
      for (const chunk of event.children) {
        const node = document.createElement(chunk.type === "button" ? "button" : "span");
        node.textContent = chunk.text;
        applyStyle(node, chunk.style);
        if (chunk.type === "button") {
          node.type = "button";
          node.disabled = true;
          node.dataset.value = String(chunk.value);
          node.dataset.epoch = String(epoch);
          choiceButtons.add(node);
          buttons.push(node);
        }
        row.append(node);
      }
      if (buttons.length) rowButtons.set(row, buttons);
    }
  } else row.textContent = event.value || "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
  fragment.append(row);
}
function timedNotice() {
  if (waiting?.type !== "tinput") return;
  const seconds = Math.max(0, (waiting.deadline - Date.now()) / 1e3);
  $("#notice").textContent = waiting.countdown ? `\uC81C\uD55C\uC2DC\uAC04 ${seconds.toFixed(1)}\uCD08 \u2014 \uC2DC\uAC04\uC774 \uB05D\uB098\uBA74 \uAC8C\uC784\uC758 \uAE30\uBCF8 \uC120\uD0DD\uC73C\uB85C \uC9C4\uD589\uD569\uB2C8\uB2E4.` : "\uC81C\uD55C\uC2DC\uAC04 \uC785\uB825 \u2014 \uC2DC\uAC04\uC774 \uB05D\uB098\uBA74 \uAC8C\uC784\uC758 \uAE30\uBCF8 \uC120\uD0DD\uC73C\uB85C \uC9C4\uD589\uD569\uB2C8\uB2E4.";
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && worker) {
    timedNotice();
    worker.postMessage({ type: "resume" });
  }
});
async function start(selected) {
  if (starting || backup.isBusy()) return;
  stop();
  starting = true;
  backup.update();
  try {
    await withSaveLock(() => new Promise((resolve) => {
      releaseSession = resolve;
      try {
        launch(selected);
      } catch (error) {
        stop("\uC2E4\uD328: " + error.message);
      }
      starting = false;
      backup.update();
    }));
  } catch (error) {
    state(error.message);
  } finally {
    starting = false;
    backup.update();
  }
}
function launch(selected) {
  mode = selected;
  epoch = 0;
  trace = createRuntimeTrace(void 0, mode);
  showPrevious();
  recordPhase("start");
  followNext = true;
  following = true;
  output.replaceChildren();
  $("#error").textContent = "";
  $("#notice").textContent = "";
  $("#saved").textContent = "\uC774\uBC88 \uC138\uC158 \uC800\uC7A5 \uC644\uB8CC \uAE30\uB85D \uC5C6\uC74C";
  $("#session").textContent = mode === "game" ? "\uC2E4\uC81C \uAC8C\uC784 \xB7 eraTHYMKR / eraJS \uD6C4\uBCF4" : "\uB3C5\uB9BD \uC785\uB825\xB7\uC800\uC7A5 \uC2DC\uD5D8";
  state("\uD30C\uC77C \uB85C\uB529 / \uCEF4\uD30C\uC77C \uC911");
  const current = worker = new Worker("./engine-worker.js", { type: "module" });
  watch2();
  current.onerror = (event) => {
    if (worker === current) {
      $("#error").textContent = event.message;
      stop("\uC2E4\uD328", "error");
    }
  };
  current.onmessage = ({ data }) => {
    if (worker !== current) return;
    if (data.type === "save-progress") {
      recordPhase(data.phase, data.key);
      current.postMessage({ type: "progress-recorded", id: data.id });
      watch2();
    }
    if (data.type === "events") {
      renderBatch(data.events);
      current.postMessage({ type: "rendered", id: data.id });
      watch2();
    }
    if (data.type === "running") {
      if (waiting?.id === data.id) {
        endChoice();
        followNext = true;
      }
      $("#notice").textContent = "";
      state("\uC2E4\uD589 \uC911");
      watch2();
      recordPhase("running");
    }
    if (data.type === "waiting") {
      recordPhase("waiting");
      clearTimeout(watchdog);
      clearInterval(countdown);
      waiting = { ...data.event, id: data.id, deadline: data.deadline };
      controls(true);
      epoch++;
      input.inputMode = data.event.numeric ? "numeric" : "text";
      input.placeholder = data.event.type === "wait" ? "\uC785\uB825 \uC5C6\uC774 \uACC4\uC18D \u25B6 \uBC84\uD2BC\uC744 \uB204\uB974\uC138\uC694" : "\uAC12\uC744 \uC785\uB825\uD558\uAC70\uB098 \uC120\uD0DD\uC9C0\uB97C \uB204\uB974\uC138\uC694";
      status2.dataset.stack = JSON.stringify(data.stack);
      status2.dataset.waitType = data.event.type;
      status2.dataset.requestId = String(data.id);
      $("#notice").textContent = data.event.type === "wait" ? "\uBA48\uCD98 \uAC83\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uACC4\uC18D \u25B6 \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uB2E4\uC74C\uC73C\uB85C \uC9C4\uD589\uD569\uB2C8\uB2E4." : "";
      if (waiting.type === "tinput") {
        timedNotice();
        if (waiting.countdown) countdown = setInterval(timedNotice, 100);
      }
      if (followNext) latest();
      followNext = false;
      state("\uC785\uB825 \uB300\uAE30");
    }
    if (data.type === "saved") $("#saved").textContent = "\uC800\uC7A5 \uC644\uB8CC: " + data.key;
    if (data.type === "ended") stop(mode === "game" ? "\uAC8C\uC784 \uC885\uB8CC" : "\uC2DC\uD5D8 \uC885\uB8CC", "ended");
    if (data.type === "error") {
      $("#error").textContent = JSON.stringify(data.error, null, 2);
      stop("\uC2E4\uD328 \u2014 \uC5D4\uC9C4 \uD638\uD658\uC131/\uC800\uC7A5 \uC624\uB958\uB97C \uD655\uC778\uD558\uC138\uC694", "error");
    }
  };
  current.postMessage({ type: "start", mode });
}
$("form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (composing) return;
  const value = input.value;
  send(value);
  if (!waiting) input.value = "";
});
input.addEventListener("compositionstart", () => {
  composing = true;
});
input.addEventListener("compositionend", () => {
  composing = false;
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.isComposing || composing || event.keyCode === 229)) event.preventDefault();
});
$("#continue").addEventListener("click", () => {
  if (waiting?.type === "wait") send("");
});
$("#game-start").addEventListener("click", () => start("game"));
$("#start").addEventListener("click", () => start("fixture"));
$("#stop").addEventListener("click", () => stop());
controls(false);
