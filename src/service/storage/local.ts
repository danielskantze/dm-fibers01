import type { StorageSettings, ArrayStore, ObjectStore } from "../storage";

export function createArray<T>(settings: StorageSettings): ArrayStore<T> {
  const { type, key } = settings;
  if (type !== "localStorage") {
    throw new Error("Unsupported type");
  }

  function save(data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function load(): T[] {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as T[];
    } catch (e) {
      return [];
    }
  }
  return { save, load };
}

export function createObject<T>(
  settings: StorageSettings,
  defaultData: T
): ObjectStore<T> {
  const { type, key } = settings;
  if (type !== "localStorage") {
    throw new Error("Unsupported type");
  }

  function save(data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function load(): T {
    const data = localStorage.getItem(key);
    if (!data) {
      return defaultData;
    }
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      return defaultData;
    }
  }
  return { save, load };
}
