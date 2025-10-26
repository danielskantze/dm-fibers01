export type StorageType = "localStorage";

export type StorageSettings = {
  type: StorageType;
  key: string;
};

export type ArrayStore<T> = {
  save: (data: T[]) => void;
  load: () => T[];
};

export type ObjectStore<T> = {
  save: (data: T) => void;
  load: () => T;
};

export interface KeyedBlobItem {
  id: string;
}

export interface MutableBlomItemMetadata {
  name: string;
}
export interface BlobItemMetadata extends KeyedBlobItem, MutableBlomItemMetadata {
  type: string;
  originalName: string;
  addedAt: Date;
  size: number;
}

export interface BlobItemData extends KeyedBlobItem {
  data: ArrayBuffer;
}
export interface BlobItem extends BlobItemData, BlobItemMetadata {}

export type BlobAddItem = Omit<BlobItem, "originalName" | "addedAt" | "size">;

export type BlobStore = {
  list(type?: string): Promise<BlobItemMetadata[]>;
  add(item: BlobAddItem): Promise<void>;
  remove(id: string): Promise<void>;
  update(item: KeyedBlobItem & Partial<MutableBlomItemMetadata>): Promise<void>;
  get(id: string): Promise<BlobItem | undefined>;
  has(id: string): Promise<boolean>;
};
