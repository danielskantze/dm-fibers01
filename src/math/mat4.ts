import type { Matrix3x3, Matrix4x4, Vec3, Vec4 } from "./types";
import * as mat3 from "./mat3";

export function create(a: [
  number, number, number, number, 
  number, number, number, number, 
  number, number, number, number, 
  number, number, number, number 
]) {
  return new Float32Array(a);
}

export function fromMat3(m: Matrix3x3, affine: boolean = false): Matrix4x4 {
  return create([
    m[0], m[1], m[2], 0,
    m[3], m[4], m[5], 0,
    m[6], m[7], m[8], 0,
    0, 0, 0, affine ? 1 : 0]);
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
  const result: Matrix4x4 = new Float32Array(
    [0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0]);
  ;

  for (let i = 0; i < 4; i++) {   // Iterate over rows of the result matrix
    for (let j = 0; j < 4; j++) { // Iterate over columns of the result matrix
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
  const matrix: Matrix4x4 = new Float32Array(
    [1.0, 0.0, 0.0, 0.0,
    0, Math.cos(angle), -Math.sin(angle), 0.0,
    0, Math.sin(angle), Math.cos(angle), 0.0,
    0.0, 0.0, 0.0, 1.0]);
  return matrix;
}

export function rotateY(angle: number): Matrix4x4 {
  const matrix: Matrix4x4 = new Float32Array(
    [Math.cos(angle), 0, Math.sin(angle), 0.0,
    0.0, 1.0, 0.0, 0.0,
    -Math.sin(angle), 0, Math.cos(angle), 0.0,
    0.0, 0.0, 0.0, 1.0]
  );
  return matrix;
}

export function rotateZ(angle: number): Matrix4x4 {
  const matrix: Matrix4x4 = new Float32Array(
    [Math.cos(angle), -Math.sin(angle), 0.0, 0.0,
    Math.sin(angle), Math.cos(angle), 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ]);
  return matrix;
}

export function identity(): Matrix4x4 {
  return new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  ]);
}

export function scaleC(s: number): Matrix4x4 {
  return new Float32Array([
    s, 0.0, 0.0, 0.0,
    0.0, s, 0.0, 0.0,
    0.0, 0.0, s, 0.0,
    0.0, 0.0, 0.0, 1.0,
  ]);
}

export function scaleVec3(s: Vec3): Matrix4x4 {
  return new Float32Array([
    s[0], 0.0, 0.0, 0.0,
    0.0, s[1], 0.0, 0.0,
    0.0, 0.0, s[2], 0.0,
    0.0, 0.0, 0.0, 1.0,
  ]);
}

export function getVectorRotationMat(from: Vec3, to: Vec3): Matrix4x4 {
  return fromMat3(mat3.getVectorRotationMat(from, to), true);
}