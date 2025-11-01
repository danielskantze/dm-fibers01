import type { BlendFunction, BlendMode, DomainFunction, Range } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function frac(value: number): number {
  return value - Math.floor(value);
}

export type ScalarMapFn = (x: number) => number;

export function createDomainMapping(
  a: Range<number>,
  b: Range<number>,
  clamped: boolean = false
): {
  map: ScalarMapFn;
  unmap: ScalarMapFn;
} {
  const rangeA = a.max - a.min;
  const rangeB = b.max - b.min;
  const scale = rangeA === 0 ? 0 : rangeB / rangeA;
  const iScale = rangeB === 0 ? 0 : rangeA / rangeB;
  const map = (x: number) => b.min + scale * (x - a.min);
  const unmap = (x: number) => a.min + iScale * (x - b.min);
  return !clamped
    ? { map, unmap }
    : {
        map: (x: number) => clamp(map(x), b.min, b.max),
        unmap: (x: number) => clamp(unmap(x), a.min, a.max),
      };
}

export function createDomainFn(
  a: Range<number>,
  b: Range<number>
): DomainFunction<number> {
  return createDomainMapping(a, b).map;
}

export function createBlendFn(
  blendMode: BlendMode,
  scale: number
): BlendFunction<number> {
  switch (blendMode) {
    case "add":
      return (a: number, b: number) => {
        return a + scale * b;
      };
    case "multiply":
      return (a: number, b: number) => a * b;
  }
}
