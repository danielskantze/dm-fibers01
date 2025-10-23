export type StorageType = "localStorage";

export type StorageSettings = {
  type: StorageType;
  key: string;
}

export type Store<T> = {
  save: (data: T[]) => void,
  load: () => T[]
}

export interface KeyedBlobItem {
  id: string;
}

export interface BlobItemMetadata extends KeyedBlobItem {
  name: string,
  type: string,
  addedAt: string,
  size: number,
}

export interface BlobItemData extends KeyedBlobItem {
  blob: any
}

export interface BlobItem extends BlobItemData, BlobItemMetadata {

};

export type BlobStore = {
  list(type?: string): Promise<BlobItemMetadata[]>;
  put(item: BlobItem): Promise<void>;
  get(id: string): Promise<BlobItem | undefined>;
  has(id: string): Promise<boolean>;
}