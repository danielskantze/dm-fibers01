import type {
  Vec3,
  Range,
  Matrix3x3Vec,
  Vec4,
  BlendMode,
  BlendFunction,
  DomainFunction,
} from "./types";
import { clamp as clampScalar, mix as mixScalar } from "./scalar";

export function create(a: [number, number, number] | Float32Array): Vec3 {
  return new Float32Array(a);
}

export function fromScalar(a: number): Vec3 {
  return Float32Array.of(a, a, a);
}

export function fromValues(x: number, y: number, z: number): Vec3 {
  return Float32Array.of(x, y, z);
}

export function createZero(): Vec3 {
  return Float32Array.of(0, 0, 0);
}

export function createRandom(min: Vec3, max: Vec3): Vec3 {
  const dist = sub(max, min);
  dist[0] = Math.random() * dist[0];
  dist[1] = Math.random() * dist[1];
  dist[2] = Math.random() * dist[2];
  return add(min, dist);
}

function multiplyMatrix(v: Vec3, m: Matrix3x3Vec): Vec3 {
  return [
    v[0] * m[0][0] + v[1] * m[1][0] + v[2] * m[2][0],
    v[0] * m[0][1] + v[1] * m[1][1] + v[2] * m[2][1],
    v[0] * m[0][2] + v[1] * m[1][2] + v[2] * m[2][2],
  ];
}

export function rotateX(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3Vec = [
    [1.0, 0.0, 0.0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)],
  ];
  return multiplyMatrix(vector, matrix);
}

export function rotateY(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3Vec = [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)],
  ];
  return multiplyMatrix(vector, matrix);
}

export function rotateZ(vector: Vec3, angle: number): Vec3 {
  const matrix: Matrix3x3Vec = [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 1],
  ];
  return multiplyMatrix(vector, matrix);
}

export function scale(vector: Vec3, scale: number): Vec3 {
  return [vector[0] * scale, vector[1] * scale, vector[2] * scale];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  const r: Vec3 = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  return r;
}

export function length(vector: Vec3): number {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
}

export function normalize(vector: Vec3): Vec3 {
  const l = length(vector);
  return [vector[0] / l, vector[1] / l, vector[2] / l];
}

export function equals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function toPolar(vector: Vec3): Vec3 {
  const rotX = Math.atan2(vector[1], vector[0]);
  const rotZ = Math.asin(vector[2] / length(vector));
  return [length(vector), rotX, rotZ];
}

export function fromPolar(vector: Vec3): Vec3 {
  return [
    vector[0] * Math.cos(vector[1]) * Math.cos(vector[2]),
    vector[0] * Math.sin(vector[1]) * Math.cos(vector[2]),
    vector[0] * Math.sin(vector[2]),
  ];
}

export function fromVec4(vec4: Vec4): Vec3 {
  return vec4.slice(0, 3) as Vec3;
}

export function copy(v: Vec3): Vec3 {
  return v.slice() as Vec3;
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]] as Vec3;
}

export function addScaleB(a: Vec3, b: Vec3, s: number): Vec3 {
  return fromValues(a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]);
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] as Vec3;
}

export function div(a: Vec3, b: Vec3): Vec3 {
  return [a[0] / b[0], a[1] / b[1], a[2] / b[2]] as Vec3;
}

export function mul(a: Vec3, b: Vec3): Vec3 {
  return [a[0] * b[0], a[1] * b[1], a[2] * b[2]] as Vec3;
}

export function neg(a: Vec3): Vec3 {
  return [-a[0], a[1], -a[2]] as Vec3;
}

export function max(a: Vec3, b: Vec3): Vec3 {
  return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])] as Vec3;
}

export function min(a: Vec3, b: Vec3): Vec3 {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])] as Vec3;
}

export function clamp(value: Vec3, min: Vec3, max: Vec3): Vec3 {
  return create([
    clampScalar(value[0], min[0], max[0]),
    clampScalar(value[1], min[1], max[1]),
    clampScalar(value[2], min[2], max[2]),
  ]);
}

export function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  if (t < 0) {
    return a;
  } else if (t > 1.0) {
    return b;
  }
  return fromValues(
    mixScalar(a[0], b[0], t),
    mixScalar(a[1], b[1], t),
    mixScalar(a[2], b[2], t)
  );
}

export function mixO(a: Vec3, b: Vec3, out: Vec3, t: number) {
  if (t < 0) {
    return a;
  } else if (t > 1.0) {
    return b;
  }
  out[0] = mixScalar(a[0], b[0], t);
  out[1] = mixScalar(a[1], b[1], t);
  out[2] = mixScalar(a[2], b[2], t);
}

export function clampS(value: Vec3, min: number, max: number): Vec3 {
  return create([
    clampScalar(value[0], min, max),
    clampScalar(value[1], min, max),
    clampScalar(value[2], min, max),
  ]);
}

export function createBlendFn(blendMode: BlendMode, s: number): BlendFunction<Vec3> {
  switch (blendMode) {
    case "add":
      return (a, b) => addScaleB(a, b, s);
    case "multiply":
      return mul;
  }
}

function hasZero(v: Vec3): boolean {
  return v[0] === 0 || v[1] === 0 || v[2] === 0;
}

export function createDomainFn(a: Range<Vec3>, b: Range<Vec3>): DomainFunction<Vec3> {
  const rangeA = sub(a.max, a.min);
  const rangeB = sub(b.max, b.min);
  const scale = hasZero(rangeA) ? createZero() : div(rangeB, rangeA);
  return (x: Vec3) => add(b.min, mul(scale, sub(x, a.min)));
}
