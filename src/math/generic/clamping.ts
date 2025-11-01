import { clamp as clampScalar } from "../scalar";
import { clamp as clampIScalar } from "../iscalar";
import { clampS as clampVec3S } from "../vec3";
import { clampS as clampVec4S } from "../vec4";
import { clampS as clampMat3S } from "../mat3";
import { clampS as clampMat4S } from "../mat4";
import { clampS as clampMat43S } from "../mat43";

import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

type ClampFn<T> = (value: T, min: number, max: number) => T;

export const clamperFactory: {
  [K in UniformType]: ClampFn<UniformValueMap[K]>;
} = {
  float: clampScalar,
  int: clampIScalar,
  vec3: clampVec3S,
  vec4: clampVec4S,
  mat3: clampMat3S,
  mat4: clampMat4S,
  mat43: clampMat43S,
  vec2: function (
    value: Float32Array<ArrayBufferLike>,
    min: number,
    max: number
  ): Float32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (
    value: Int32Array<ArrayBufferLike>,
    min: number,
    max: number
  ): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (
    value: Int32Array<ArrayBufferLike>,
    min: number,
    max: number
  ): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (
    value: Int32Array<ArrayBufferLike>,
    min: number,
    max: number
  ): Int32Array<ArrayBufferLike> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (value: unknown, min: number, max: number): unknown {
    throw new Error("Function not implemented.");
  },
  custom: function (value: unknown, min: number, max: number): unknown {
    throw new Error("Function not implemented.");
  },
};
