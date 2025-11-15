import * as scalar from "../scalar";
import * as iscalar from "../scalar";
import * as vec3 from "../vec3";
import * as vec4 from "../vec4";
import type { BlendFunction, Matrix3x3, Matrix4x3, Matrix4x4 } from "../types";
import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

type CreateSmoothingFn<T> = (strength: number) => BlendFunction<T>;

export const smoothingFactory: {
  [K in UniformType]: CreateSmoothingFn<UniformValueMap[K]>;
} = {
  float: scalar.createSmoothingFn,
  vec4: vec4.createSmoothingFn,
  vec3: vec3.createSmoothingFn,
  int: iscalar.createSmoothingFn,
  vec2: function (strength: number): BlendFunction<Float32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (strength: number): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (strength: number): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (strength: number): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  mat4: function (strength: number): BlendFunction<Matrix4x4> {
    throw new Error("Function not implemented.");
  },
  mat3: function (strength: number): BlendFunction<Matrix3x3> {
    throw new Error("Function not implemented.");
  },
  mat43: function (strength: number): BlendFunction<Matrix4x3> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (strength: number): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
  custom: function (strength: number): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
};
