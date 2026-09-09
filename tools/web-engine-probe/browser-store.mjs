// Probe-only persistence. One transaction per engine file; NOT an atomic slot+GLOBAL SaveService.
export function createStore(name = 'era-engine-probe-v1') {
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(name, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('saves');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error('Probe database upgrade blocked'));
});
async function transact(mode, operation) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', mode);
    const request = operation(tx.objectStore('saves'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error ?? request.error ?? new Error('Probe transaction aborted'));
    tx.onerror = () => {}; // onabort reports failure; never acknowledge before commit.
  });
}
return {
  get: key => transact('readonly', objectStore => objectStore.get(key)),
  set: (key, value) => transact('readwrite', objectStore => objectStore.put(value, key)),
  async entries() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly'), store = tx.objectStore('saves');
      const keys = store.getAllKeys(), values = store.getAll();
      tx.oncomplete = () => resolve(keys.result.map((key, i) => [key, values.result[i]]));
      tx.onabort = () => reject(tx.error ?? new Error('Snapshot aborted'));
      tx.onerror = () => {};
    });
  },
  async replaceAll(entries) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite'), store = tx.objectStore('saves');
      let failure;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Restore aborted'));
      tx.onerror = () => {};
      try {
        store.clear();
        for (const [key, value] of entries) store.put(value, key);
      } catch (error) { failure = error; tx.abort(); }
    });
  },
  async close() { (await dbPromise).close(); }
};
}
