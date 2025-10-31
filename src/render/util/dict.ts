export function filter<T>(
  include: (k: string, v: T) => boolean,
  dict: Record<string, T>
): Record<string, T> {
  const result: Record<string, T> = {};
  Object.entries(dict).forEach(([k, v]) => {
    if (include(k, v)) {
      result[k] = v;
    }
  });
  return result;
}

export function filterType<T, S extends T>(
  include: (v: T) => v is S,
  dict: Record<string, T>
): Record<string, S> {
  const result: Record<string, S> = {};
  Object.entries(dict).forEach(([k, v]) => {
    if (include(v)) {
      result[k] = v as S;
    }
  });
  return result;
}

export function orderedValues<T>(
  compare: (a: T, b: T) => number,
  dict: Record<string, T>
) {
  const objects = Object.values(dict);
  objects.sort(compare);
  return objects;
}
