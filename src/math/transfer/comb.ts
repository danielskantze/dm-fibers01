import { frac } from "../scalar";

export function create(points: number, order: 1 | 2 | 3 | 4): (x: number) => number {
  const mapSin = (t: number) => (1.0 + Math.sin((t - 0.5) * Math.PI)) * 0.5;
  let easeFn = mapSin;
  switch (order) {
    case 2:
      easeFn = (x: number) => mapSin(mapSin(x));
      break;
    case 3:
      easeFn = (x: number) => mapSin(mapSin(mapSin(x)));
      break;
    case 4:
      easeFn = (x: number) => mapSin(mapSin(mapSin(mapSin(x))));
      break;
  }
  const fn = (x: number) => {
    const t = frac(x * points);
    const v = x * points - t;
    const s = 1 / points;
    const p = easeFn(t);
    return (v + s * p) / points;
  };
  return fn;
}
