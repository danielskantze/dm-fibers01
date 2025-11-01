import { clamp as clampScalar } from "../scalar";
import { clamp as clampIScalar } from "../iscalar";
import * as vec3 from "../vec3";
import * as vec4 from "../vec4";
import * as mat3 from "../mat3";
import * as mat4 from "../mat4";
import * as mat43 from "../mat43";
import { clampS as clampVec4S } from "../vec4";
import { clampS as clampMat3S } from "../mat3";
import { clampS as clampMat4S } from "../mat4";
import { clampS as clampMat43S } from "../mat43";

import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

type CreateFn<T> = (scalar: number) => T;

export const fromScalarFactory: {
  [K in UniformType]: CreateFn<UniformValueMap[K]>;
} = {
  float: v => v,
  int: Math.round,
  vec3: vec3.fromScalar,
  vec4: vec4.fromScalar,
  mat3: mat3.fromScalar,
  mat4: mat4.fromScalar,
  mat43: mat43.fromScalar,
  vec2: function (value: number): Float32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (value: number): unknown {
    return value;
  },
  custom: function (value: number): unknown {
    return value;
  },
};

export const fromScalarToFloatFactory: {
  [K in UniformType]: CreateFn<UniformValueMap[K]>;
} = {
  float: v => v,
  int: v => v,
  vec3: vec3.fromScalar,
  vec4: vec4.fromScalar,
  mat3: mat3.fromScalar,
  mat4: mat4.fromScalar,
  mat43: mat43.fromScalar,
  vec2: function (value: number): Float32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (value: number): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (value: number): unknown {
    return value;
  },
  custom: function (value: number): unknown {
    return value;
  },
};
