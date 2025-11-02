import {
  frac,
  smootherstep_u,
  smoothstep_7u,
  smoothstep_9u,
  smoothstep_u,
} from "../scalar";

export function create(
  points: number,
  strength: 1 | 2 | 3 | 4 | 5 | 6 | 7
): (x: number) => number {
  let easeFn = smoothstep_u;
  switch (strength) {
    case 2:
      easeFn = (x: number) => smootherstep_u(x);
      break;
    case 3:
      easeFn = (x: number) => smoothstep_7u(x);
      break;
    case 4:
      easeFn = (x: number) => smoothstep_9u(x);
      break;
    case 5:
      easeFn = (x: number) => smootherstep_u(smootherstep_u(x));
      break;
    case 6:
      easeFn = (x: number) => smoothstep_7u(smoothstep_7u(x));
      break;
    case 7:
      easeFn = (x: number) => smoothstep_9u(smoothstep_9u(x));
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
