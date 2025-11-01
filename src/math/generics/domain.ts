import { createDomainFn } from "../scalar";
import type {
  DomainFunction,
  Matrix3x3,
  Matrix4x3,
  Matrix4x4,
  Range,
  Vec3,
  Vec4,
} from "../types";
import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

// TODO: This should accept the UniformType style values rather than just a number. We will fix this later when we make UniformValueDomain contextual
type CreateDomainFn<T> = (a: Range<number>, b: Range<number>) => DomainFunction<T>;

export const domainFactory: {
  [K in UniformType]: CreateDomainFn<UniformValueMap[K]>;
} = {
  float: createDomainFn,
  custom: function (a: Range<number>, b: Range<number>): DomainFunction<unknown> {
    throw new Error("Function not implemented.");
  },
  vec4: function (a: Range<number>, b: Range<number>): DomainFunction<Vec4> {
    throw new Error("Function not implemented.");
  },
  vec3: function (a: Range<number>, b: Range<number>): DomainFunction<Vec3> {
    throw new Error("Function not implemented.");
  },
  vec2: function (
    a: Range<number>,
    b: Range<number>
  ): DomainFunction<Float32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec4: function (
    a: Range<number>,
    b: Range<number>
  ): DomainFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec3: function (
    a: Range<number>,
    b: Range<number>
  ): DomainFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  ivec2: function (
    a: Range<number>,
    b: Range<number>
  ): DomainFunction<Int32Array<ArrayBufferLike>> {
    throw new Error("Function not implemented.");
  },
  int: function (a: Range<number>, b: Range<number>): DomainFunction<number> {
    throw new Error("Function not implemented.");
  },
  mat4: function (a: Range<number>, b: Range<number>): DomainFunction<Matrix4x4> {
    throw new Error("Function not implemented.");
  },
  mat3: function (a: Range<number>, b: Range<number>): DomainFunction<Matrix3x3> {
    throw new Error("Function not implemented.");
  },
  mat43: function (a: Range<number>, b: Range<number>): DomainFunction<Matrix4x3> {
    throw new Error("Function not implemented.");
  },
  tex2d: function (a: Range<number>, b: Range<number>): DomainFunction<unknown> {
    throw new Error("Function not implemented.");
  },
};
