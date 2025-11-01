import { createBlendFn } from "../scalar";
import type {
  BlendFunction,
  BlendMode,
  Matrix3x3,
  Matrix4x3,
  Matrix4x4,
  Vec3,
  Vec4,
} from "../types";
import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

type CreateBlenderFn<T> = (blendMode: BlendMode) => BlendFunction<T>;

export const blenderFactory: {
  [K in UniformType]: CreateBlenderFn<UniformValueMap[K]>;
} = {
  float: createBlendFn,
  vec4: function (blendMode: BlendMode): BlendFunction<Vec4> {
    throw new Error("Function not implemented.");
  },
  vec3: function (blendMode: BlendMode): BlendFunction<Vec3> {
    throw new Error("Function not implemented.");
  },
  vec2: function (blendMode: BlendMode): BlendFunction<Float32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (blendMode: BlendMode): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (blendMode: BlendMode): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (blendMode: BlendMode): BlendFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  int: function (blendMode: BlendMode): BlendFunction<number> {
    throw new Error("Function not implemented.");
  },
  mat4: function (blendMode: BlendMode): BlendFunction<Matrix4x4> {
    throw new Error("Function not implemented.");
  },
  mat3: function (blendMode: BlendMode): BlendFunction<Matrix3x3> {
    throw new Error("Function not implemented.");
  },
  mat43: function (blendMode: BlendMode): BlendFunction<Matrix4x3> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (blendMode: BlendMode): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
  custom: function (blendMode: BlendMode): BlendFunction<unknown> {
    throw new Error("Function not implemented.");
  },
};
