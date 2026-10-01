import { StateStorage } from 'zustand/middleware';
const DB_NAME = 'masar-platform-db';
const STORE_NAME = 'zustand-store';
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = operation(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = () => { db.close(); reject(tx.error || request.error || new Error('Storage transaction failed')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Storage transaction aborted')); };
  });
}
export const indexedDbStorage: StateStorage = {
  getItem: async name => (await transaction('readonly', store => store.get(name))) ?? null,
  setItem: async (name, value) => { await transaction('readwrite', store => store.put(value, name)); },
  removeItem: async name => { await transaction('readwrite', store => store.delete(name)); },
};
