import type { KVStore } from "../storage";

const indexedDB = window.indexedDB;

const Tables = {
  items: "items"
}

class IndexedDBKVStoreError extends Error {
  private _sourceError;
  constructor(message: string, error?: Error | null) {
    super(message);
    this._sourceError = error;
  }

  get sourceError() {
    return this._sourceError;
  }
}

const currentVersion = 1;

function waitForReq<T extends IDBRequest, K>(request: T): Promise<K> {
  const promise = new Promise<K>((resolve, reject) => {
    request.onsuccess = (e: Event) => {
      if (!e.target) {
        reject(new IndexedDBKVStoreError("No target in success event"));
        return;
      }
      resolve((e.target as T).result as K);
    };
    request.onerror = (e: Event) => {
      reject(new IndexedDBKVStoreError("Request failed", e));
    };
  });
  return promise;
}

class IndexedDBKVStore implements KVStore {
  private _db: IDBDatabase | null = null;

  constructor() {

  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(Tables.items, currentVersion);
      req.onsuccess = () => {
        this._db = req.result;
        resolve();
      };
      req.onerror = () => {
        const error = req.error;
        reject(new IndexedDBKVStoreError("DB open failed", error))
      };
      req.onupgradeneeded = (e: Event) => {

      }
    })
  }

  async get<T>(id: string): Promise<T> {
    this._db.
  }
}