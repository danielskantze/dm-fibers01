import type {
  Range,
  BlendFunction,
  BlendMode,
  Vec3,
  Vec4,
  DomainFunction,
} from "./types";
import { clamp as clampScalar } from "./scalar";

export function create(a: [number, number, number, number] | Float32Array): Vec4 {
  return new Float32Array(a);
}

export function fromScalar(a: number): Vec4 {
  return Float32Array.of(a, a, a, a);
}

export function fromValues(x: number, y: number, z: number, w: number): Vec4 {
  return Float32Array.of(x, y, z, w);
}

export function createZero(): Vec4 {
  return Float32Array.of(0, 0, 0, 0);
}

export function scale(v: Vec4, s: number): Vec4 {
  return fromValues(v[0] * s, v[1] * s, v[2] * s, v[3] * s);
}

export function add(a: Vec4, b: Vec4): Vec4 {
  return fromValues(a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]);
}

export function addScaleB(a: Vec4, b: Vec4, s: number): Vec4 {
  return fromValues(a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2], a[3] + s * b[3]);
}

export function sub(a: Vec4, b: Vec4): Vec4 {
  return fromValues(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
}

export function div(a: Vec4, b: Vec4): Vec4 {
  return fromValues(a[0] / b[0], a[1] / b[1], a[2] / b[2], a[3] / b[3]);
}

export function mul(a: Vec4, b: Vec4): Vec4 {
  return fromValues(a[0] * b[0], a[1] * b[1], a[2] * b[2], a[3] * b[3]);
}

export function neg(a: Vec4): Vec4 {
  return fromValues(-a[0], a[1], -a[2], -a[3]);
}

export function fromVec3(v: Vec3, pad: number = 0.0): Vec4 {
  return fromValues(v[0], v[1], v[2], pad);
}

export function clamp(value: Vec4, min: Vec4, max: Vec4): Vec4 {
  return fromValues(
    clampScalar(value[0], min[0], max[0]),
    clampScalar(value[1], min[1], max[1]),
    clampScalar(value[2], min[2], max[2]),
    clampScalar(value[3], min[3], max[3])
  );
}
export function clampS(value: Vec4, min: number, max: number): Vec4 {
  return fromValues(
    clampScalar(value[0], min, max),
    clampScalar(value[1], min, max),
    clampScalar(value[2], min, max),
    clampScalar(value[3], min, max)
  );
}

export function createBlendFn(blendMode: BlendMode, s: number): BlendFunction<Vec4> {
  switch (blendMode) {
    case "add":
      return (a, b) => addScaleB(a, b, s);
    case "multiply":
      return mul;
    case "overwrite":
      return (_, b) => scale(b, s);
  }
}

function hasZero(v: Vec4): boolean {
  return v[0] === 0 || v[1] === 0 || v[2] === 0;
}

export function createDomainFn(a: Range<Vec4>, b: Range<Vec4>): DomainFunction<Vec4> {
  const rangeA = sub(a.max, a.min);
  const rangeB = sub(b.max, b.min);
  const scale = hasZero(rangeA) ? createZero() : div(rangeB, rangeA);
  return (x: Vec4) => add(b.min, mul(scale, sub(x, a.min)));
}
