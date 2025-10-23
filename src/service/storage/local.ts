import type { StorageSettings, Store } from "../storage";

export function createStore<T>(settings: StorageSettings): Store<T> {
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
  return {save, load}
}