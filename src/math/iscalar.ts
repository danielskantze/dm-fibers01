export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}
