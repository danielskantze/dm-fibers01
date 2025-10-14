export type StorageType = "localStorage";

export type StorageSettings = {
  type: StorageType;
}

export interface LocalStorageSettings extends StorageSettings {
  prefix: string;
}

export type Store<T> = {
  save: (key: string, data: T[]) => void,
  load: (key: string) => T[]
}

export function createStore<T>(settings: StorageSettings): Store<T> {
  const { type } = settings;
  if (type !== "localStorage") {
    throw new Error("Unsupported type");
  }
  const { prefix } = (settings as LocalStorageSettings);

  function getKey(key: string): string {
    return `${prefix}-${key}`;
  }

  function save(key: string, data: T[]) {
    localStorage.setItem(getKey(key), JSON.stringify(data));
  }

  function load(key: string): T[] {
    const data = localStorage.getItem(getKey(key));
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as T[];
    } catch (e) {
      return [];
    }
  }
  return {save, load}
}

