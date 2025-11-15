import type { BlendFunction } from "./types";
import { mix } from "./scalar";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function createSmoothingFn(strength: number): BlendFunction<number> {
  return (a: number, b: number) => {
    return Math.round(mix(a, b, strength));
  };
}
