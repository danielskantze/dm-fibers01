import * as scalar from "../scalar";
import * as vec3 from "../vec3";
import * as vec4 from "../vec4";
import type { BlendFunction, BlendMode, Matrix3x3, Matrix4x3, Matrix4x4 } from "../types";
import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

type CreateBlenderFn<T> = (blendMode: BlendMode, scale: number) => BlendFunction<T>;

export const blenderFactory: {
  [K in UniformType]: CreateBlenderFn<UniformValueMap[K]>;
} = {
  float: scalar.createBlendFn,
  vec4: vec4.createBlendFn,
  vec3: vec3.createBlendFn,
  int: scalar.createBlendFn,
  vec2: function (
    blendMode: BlendMode,
    scale: number
  ): BlendFunction<Float32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (
    blendMode: BlendMode,
    scale: number
  ): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (
    blendMode: BlendMode,
    scale: number
  ): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (
    blendMode: BlendMode,
    scale: number
  ): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  mat4: function (blendMode: BlendMode, scale: number): BlendFunction<Matrix4x4> {
    throw new Error("Function not implemented.");
  },
  mat3: function (blendMode: BlendMode, scale: number): BlendFunction<Matrix3x3> {
    throw new Error("Function not implemented.");
  },
  mat43: function (blendMode: BlendMode, scale: number): BlendFunction<Matrix4x3> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (blendMode: BlendMode, scale: number): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
  custom: function (blendMode: BlendMode, scale: number): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
};
