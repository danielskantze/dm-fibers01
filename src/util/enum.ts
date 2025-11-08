export function createEnumMap<T extends string>(values: readonly T[]) {
  return {
    values,
    stringToInt: (value: T) => values.indexOf(value),
    intToString: (value: number) => values[value] ?? values[0],
  };
}
