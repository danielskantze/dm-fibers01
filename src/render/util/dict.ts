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

export function orderedValues<T>(
  compare: (a: T, b: T) => number,
  dict: Record<string, T>
) {
  const objects = Object.values(dict);
  objects.sort(compare);
  return objects;
}
