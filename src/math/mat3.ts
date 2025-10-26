import type { Matrix3x3, Vec3 } from "./types";
import * as vec3 from "./vec3";

export function create(
  a: [number, number, number, number, number, number, number, number, number]
) {
  return new Float32Array(a);
}

export function identity(): Matrix3x3 {
  return new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
}

export function zero(): Matrix3x3 {
  return new Float32Array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
}

export function copy(m: Matrix3x3): Matrix3x3 {
  return m.slice();
}

export function multiplyScalar(s: number, m: Matrix3x3): Matrix3x3 {
  const r = zero();
  for (let i = 0; i < 12; i++) {
    r[i] = s * m[i];
  }
  return r;
}

export function multiplyMat(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const r = zero();

  for (let i = 0; i < 3; i++) {
    // Iterate over rows of the result matrix
    for (let j = 0; j < 3; j++) {
      // Iterate over columns of the result matrix
      // Calculate the dot product of m1's i-th row and m2's j-th column
      r[i * 3 + j] =
        a[i * 3 + 0] * b[0 + j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }

  return r;
}

export function addMat(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const r = zero();
  for (let i = 0; i < 12; i++) {
    r[i] = a[i] + b[i];
  }
  return r;
}

export function addMats(...m: Matrix3x3[]): Matrix3x3 {
  const r = zero();
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < m.length; j++) {
      r[i] += m[j][i];
    }
  }
  return r;
}

export function subMat(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const r = zero();
  for (let i = 0; i < 12; i++) {
    r[i] = a[i] - b[i];
  }
  return r;
}

export function getVectorRotationMat(from: Vec3, to: Vec3): Matrix3x3 {
  const a = vec3.normalize(from);
  const b = vec3.normalize(to);
  const cos = vec3.dot(a, b);
  if (cos > 0.999999) {
    return identity();
  }
  if (cos < -0.999999) {
    // find arbitrary perpendicular vector, i.e. find the vector xyz that gives 0 as dot product
    // a[0] * x + a[1] * y + a[2] * z = 0.
    //
    let axis: Vec3; // corresponds to xyz in the example above
    if (Math.abs(a[0]) > Math.abs(a[2])) {
      axis = [-a[1], a[0], 0]; // if x is more "dominant" than z, just drop z (we can pick any perpendicular vector). By swizzling the axes we rotate 90 degrees. Easy to verify with a 2d drawing
    } else {
      axis = [0, -a[2], a[1]]; // if z is dominant, then we drop x and swizzle accordingly
    }
    axis = vec3.normalize(axis);
    return create([
      2 * axis[0] * axis[0] - 1,
      2 * axis[0] * axis[1],
      2 * axis[0] * axis[2],
      2 * axis[0] * axis[1],
      2 * axis[1] * axis[1] - 1,
      2 * axis[1] * axis[2],
      2 * axis[0] * axis[2],
      2 * axis[1] * axis[2],
      2 * axis[2] * axis[2] - 1,
    ]);
  }
  const v = vec3.cross(a, b);
  const vn = vec3.normalize(v);
  const sin = vec3.length(v);
  const I = identity();
  const K = create([0, -vn[2], vn[1], vn[2], 0, -vn[0], -vn[1], vn[0], 0]);
  const sK = multiplyScalar(sin, K);
  const KK = multiplyMat(K, K);
  const oneMinusCKK = multiplyScalar(1.0 - cos, KK);
  return addMats(I, sK, oneMinusCKK);
}
