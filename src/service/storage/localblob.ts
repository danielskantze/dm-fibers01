import type { BlobItem, BlobItemData, BlobItemMetadata, BlobStore } from "../storage";

const indexedDB = window.indexedDB;

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
      } else {
        resolve((e.target as T).result as K);
      }
    };
    request.onerror = () => {
      reject(new IndexedDBKVStoreError("Request failed", request.error));
    };
  });
  return promise;
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  const promise = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = (e: Event) => {
      if (!e.target) {
        reject(new IndexedDBKVStoreError("No target in success event"));
      } else {
        resolve();
      }
    };
    transaction.onerror = () => {
      reject(new IndexedDBKVStoreError("Request failed", transaction.error));
    };
  });
  return promise;
}

export class IndexedDBBlobStore implements BlobStore {
  private _db: IDBDatabase | null = null;
  private _database: string;
  private _metadata: string;
  private _blobdata: string;

  constructor(database: string, prefix: string) {
    this._database = database;
    this._metadata = `${prefix}_metadata`;
    this._blobdata = `${prefix}_blobdata`;
   }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this._database, currentVersion);
      req.onsuccess = () => {
        this._db = req.result;
        resolve();
      };
      req.onerror = () => {
        const error = req.error;
        reject(new IndexedDBKVStoreError("DB open failed", error))
      };
      req.onupgradeneeded = () => {
        this._db = req.result;
        const mStore = this._db.createObjectStore(this._metadata, {keyPath: "id"});
        this._db.createObjectStore(this._blobdata, {keyPath: "id"});
        mStore.createIndex("name", "name", { unique: false });
        mStore.createIndex("type", "type", { unique: false });
      }
    })
  }

  async list(type?: string): Promise<BlobItemMetadata[]> {
    const transaction = this._db!.transaction([this._metadata], "readonly");
    const store = transaction.objectStore(this._metadata);
    let req: IDBRequest<BlobItemMetadata[]>;
    if (type) {
      req = store.index("type").getAll(type);
    } else {
      req = store.getAll();
    }
    const items: BlobItemMetadata[] = await waitForReq(req);
    await waitForTransaction(transaction);
    return items;
  }

  // Currently this is the only way we will use this. 
  // It is not so nice to always write both blob and metadata so we could consider to refactor this
  // if the requirements changes. 
  // E.g. add an updateMetada method, or we are more clever about the put method and we support optional fields
  // At that point we may want to introduce an add function instead (then we can demand all fields for that call)
  // Many thoughts... Possibly a YAGNI situation so I will not implement anything more just now
  async put(item: BlobItem): Promise<void> {
    const transaction = this._db!.transaction([this._metadata, this._blobdata], "readwrite");
    const mItem: BlobItemMetadata = {
      name: item.name,
      type: item.type,
      addedAt: item.addedAt,
      size: item.size,
      id: item.id
    };
    const bItem: BlobItemData = {
      id: item.id,
      blob: item.blob
    }
    const mStore = transaction.objectStore(this._metadata);
    const mReq = mStore.put(mItem);
    const bStore = transaction.objectStore(this._blobdata);
    const bReq = bStore.put(bItem);
    await Promise.all([waitForReq(mReq), waitForReq(bReq)]);
    await waitForTransaction(transaction);
  }
  async has(id: string): Promise<boolean> {
    const transaction = this._db!.transaction([this._metadata], "readonly");
    const store = transaction.objectStore(this._metadata);
    const req = store.count(id);
    const count: number = await waitForReq(req);
    await waitForTransaction(transaction);
    return count > 0;
  }

  async get(id: string): Promise<BlobItem | undefined> {
    const transaction = this._db!.transaction([this._metadata, this._blobdata], "readonly");
    const mStore = transaction.objectStore(this._metadata);
    const mReq = mStore.get(id);
    const bStore = transaction.objectStore(this._blobdata);
    const bReq = bStore.get(id);
    const [mItem, bItem] = (await Promise.all(
      [waitForReq(mReq), waitForReq(bReq)]
    )) as [BlobItemMetadata | undefined, BlobItemData | undefined];
    await waitForTransaction(transaction);
    if (!mItem) {
      return undefined;
    }
    return {...mItem, ...bItem!};
  }
}