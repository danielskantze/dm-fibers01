import type { BlobAddItem, BlobItem, BlobItemData, BlobItemMetadata, BlobStore, KeyedBlobItem, MutableBlomItemMetadata } from "../storage";

const indexedDB = window.indexedDB;

class IndexedDBBlobStoreError extends Error {
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
        reject(new IndexedDBBlobStoreError("No target in success event"));
      } else {
        resolve((e.target as T).result as K);
      }
    };
    request.onerror = () => {
      reject(new IndexedDBBlobStoreError("Request failed", request.error));
    };
  });
  return promise;
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  const promise = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = (e: Event) => {
      if (!e.target) {
        reject(new IndexedDBBlobStoreError("No target in success event"));
      } else {
        resolve();
      }
    };
    transaction.onerror = () => {
      reject(new IndexedDBBlobStoreError("Request failed", transaction.error));
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
        reject(new IndexedDBBlobStoreError("DB open failed", error))
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
    const mStore = transaction.objectStore(this._metadata);
    let mReq: IDBRequest<BlobItemMetadata[]>;
    if (type) {
      mReq = mStore.index("type").getAll(type);
    } else {
      mReq = mStore.getAll();
    }
    const items: BlobItemMetadata[] = await waitForReq(mReq);
    await waitForTransaction(transaction);
    return items;
  }

  // Currently this is the only way we will use this. 
  // It is not so nice to always write both blob and metadata so we could consider to refactor this
  // if the requirements changes. 
  // E.g. add an updateMetada method, or we are more clever about the put method and we support optional fields
  // At that point we may want to introduce an add function instead (then we can demand all fields for that call)
  // Many thoughts... Possibly a YAGNI situation so I will not implement anything more just now
  async add(item:BlobAddItem): Promise<void> {
    const transaction = this._db!.transaction([this._metadata, this._blobdata], "readwrite");
    const mItem: BlobItemMetadata = {
      name: item.name,
      type: item.type,
      originalName: item.name,
      addedAt: new Date(),
      size: item.data.byteLength,
      id: item.id
    };
    const bItem: BlobItemData = {
      id: item.id,
      data: item.data
    }
    const mStore = transaction.objectStore(this._metadata);
    const mReq = mStore.add(mItem);
    const bStore = transaction.objectStore(this._blobdata);
    const bReq = bStore.add(bItem);
    await Promise.all([waitForReq(mReq), waitForReq(bReq)]);
    await waitForTransaction(transaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = this._db!.transaction([this._metadata, this._blobdata], "readwrite");
    const mStore = transaction.objectStore(this._metadata);
    const mReq = mStore.delete(id);
    const bStore = transaction.objectStore(this._blobdata);
    const bReq = bStore.delete(id);
    await Promise.all([await waitForReq(mReq), await waitForReq(bReq)]);
    await waitForTransaction(transaction);
  }

  async update(item: KeyedBlobItem & Partial<MutableBlomItemMetadata>): Promise<void> {
    const transaction = this._db!.transaction([this._metadata], "readwrite");
    const mStore = transaction.objectStore(this._metadata);
    let existingItem: BlobItemMetadata = await waitForReq(mStore.get(item.id));
    // A lot of code just to change the name. 
    // But this is a good boilerplate in case we add more props later like description etc
    const newItem: BlobItemMetadata = {
      id: existingItem.id,
      name: item.name ?? existingItem.name,
      originalName: existingItem.originalName,
      type: existingItem.type,
      addedAt: existingItem.addedAt,
      size: existingItem.size
    };
    const mReq = mStore.put(newItem);
    await waitForReq(mReq);
    await waitForTransaction(transaction);
  }

  async has(id: string): Promise<boolean> {
    const transaction = this._db!.transaction([this._metadata], "readonly");
    const mStore = transaction.objectStore(this._metadata);
    const mReq = mStore.count(id);
    const count: number = await waitForReq(mReq);
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