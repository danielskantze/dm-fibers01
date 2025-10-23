export type StorageType = "localStorage";

export type StorageSettings = {
  type: StorageType;
  key: string;
}

export type Store<T> = {
  save: (data: T[]) => void,
  load: () => T[]
}

export type KVStore = {
  put<T>(id: string, item: T): Promise<void>
  get<T>(id: string): Promise<T>
  has(id: string): Promise<boolean>
}