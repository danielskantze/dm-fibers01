import type { Matrix3x3, Matrix4x4, Vec3, Vec4 } from "./types";
import * as mat3 from "./mat3";
import { clamp as clampScalar } from "./scalar";

export function create(
  a: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
) {
  return new Float32Array(a);
}

export function fromScalar(a: number): Matrix4x4 {
  return Float32Array.of(a, a, a, a, a, a, a, a, a, a, a, a, a, a, a, a);
}

export function fromValues(
  x1: number,
  y1: number,
  z1: number,
  w1: number,
  x2: number,
  y2: number,
  z2: number,
  w2: number,
  x3: number,
  y3: number,
  z3: number,
  w3: number,
  x4: number,
  y4: number,
  z4: number,
  w4: number
): Matrix4x4 {
  return Float32Array.of(x1, y1, z1, w1, x2, y2, z2, w2, x3, y3, z3, w3, x4, y4, z4, w4);
}

export function fromMat3(m: Matrix3x3, affine: boolean = false): Matrix4x4 {
  return create([
    m[0],
    m[1],
    m[2],
    0,
    m[3],
    m[4],
    m[5],
    0,
    m[6],
    m[7],
    m[8],
    0,
    0,
    0,
    0,
    affine ? 1 : 0,
  ]);
}

export function multiplyVec(v: Vec4, m: Matrix4x4): Vec4 {
  return [
    v[0] * m[0] + v[1] * m[4] + v[2] * m[8] + v[3] * m[12],
    v[0] * m[1] + v[1] * m[5] + v[2] * m[9] + v[3] * m[13],
    v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + v[3] * m[14],
    v[0] * m[3] + v[1] * m[7] + v[2] * m[11] + v[3] * m[15],
  ];
}

export function multiplyMat(m1: Matrix4x4, m2: Matrix4x4): Matrix4x4 {
  const result: Matrix4x4 = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  for (let i = 0; i < 4; i++) {
    // Iterate over rows of the result matrix
    for (let j = 0; j < 4; j++) {
      // Iterate over columns of the result matrix
      // Calculate the dot product of m1's i-th row and m2's j-th column
      result[i * 4 + j] =
        m1[i * 4 + 0] * m2[0 + j] +
        m1[i * 4 + 1] * m2[4 + j] +
        m1[i * 4 + 2] * m2[8 + j] +
        m1[i * 4 + 3] * m2[12 + j];
    }
  }

  return result;
}

export function multiplyMatMulti(...m: Matrix4x4[]): Matrix4x4 {
  if (m.length === 1) {
    return m[0];
  }
  let res = multiplyMat(m[0], m[1]);
  for (let i = 2; i < m.length; i++) {
    res = multiplyMat(res, m[i]);
  }
  return res;
}

export function rotateX(angle: number): Matrix4x4 {
  const matrix: Matrix4x4 = new Float32Array([
    1.0,
    0.0,
    0.0,
    0.0,
    0,
    Math.cos(angle),
    -Math.sin(angle),
    0.0,
    0,
    Math.sin(angle),
    Math.cos(angle),
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
  return matrix;
}

export function rotateY(angle: number): Matrix4x4 {
  const matrix: Matrix4x4 = new Float32Array([
    Math.cos(angle),
    0,
    Math.sin(angle),
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    -Math.sin(angle),
    0,
    Math.cos(angle),
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
  return matrix;
}

export function rotateZ(angle: number): Matrix4x4 {
  const matrix: Matrix4x4 = new Float32Array([
    Math.cos(angle),
    -Math.sin(angle),
    0.0,
    0.0,
    Math.sin(angle),
    Math.cos(angle),
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
  return matrix;
}

export function identity(): Matrix4x4 {
  return new Float32Array([
    1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
  ]);
}

export function scaleC(s: number): Matrix4x4 {
  return new Float32Array([
    s,
    0.0,
    0.0,
    0.0,
    0.0,
    s,
    0.0,
    0.0,
    0.0,
    0.0,
    s,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
}

export function scaleVec3(s: Vec3): Matrix4x4 {
  return new Float32Array([
    s[0],
    0.0,
    0.0,
    0.0,
    0.0,
    s[1],
    0.0,
    0.0,
    0.0,
    0.0,
    s[2],
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
}

export function getVectorRotationMat(from: Vec3, to: Vec3): Matrix4x4 {
  return fromMat3(mat3.getVectorRotationMat(from, to), true);
}

export function clamp(value: Matrix4x4, min: Matrix4x4, max: Matrix4x4): Matrix4x4 {
  return create([
    clampScalar(value[0], min[0], max[0]),
    clampScalar(value[1], min[1], max[1]),
    clampScalar(value[2], min[2], max[2]),
    clampScalar(value[3], min[3], max[3]),
    clampScalar(value[4], min[4], max[4]),
    clampScalar(value[5], min[5], max[5]),
    clampScalar(value[6], min[6], max[6]),
    clampScalar(value[7], min[7], max[7]),
    clampScalar(value[8], min[8], max[8]),
    clampScalar(value[9], min[9], max[9]),
    clampScalar(value[10], min[10], max[10]),
    clampScalar(value[11], min[11], max[11]),
    clampScalar(value[12], min[12], max[12]),
    clampScalar(value[13], min[13], max[13]),
    clampScalar(value[14], min[14], max[14]),
    clampScalar(value[15], min[15], max[15]),
  ]);
}

export function clampS(value: Matrix4x4, min: number, max: number): Matrix4x4 {
  return create([
    clampScalar(value[0], min, max),
    clampScalar(value[1], min, max),
    clampScalar(value[2], min, max),
    clampScalar(value[3], min, max),
    clampScalar(value[4], min, max),
    clampScalar(value[5], min, max),
    clampScalar(value[6], min, max),
    clampScalar(value[7], min, max),
    clampScalar(value[8], min, max),
    clampScalar(value[9], min, max),
    clampScalar(value[10], min, max),
    clampScalar(value[11], min, max),
    clampScalar(value[12], min, max),
    clampScalar(value[13], min, max),
    clampScalar(value[14], min, max),
    clampScalar(value[15], min, max),
  ]);
}
