import * as scalar from "../scalar";
import * as vec3 from "../vec3";
import * as vec4 from "../vec4";
import type { DomainFunction, Matrix3x3, Matrix4x3, Matrix4x4, Range } from "../types";
import type { UniformType, UniformValueMap } from "../../types/gl/uniforms";

// TODO: This should accept the UniformType style values rather than just a number. We will fix this later when we make UniformValueDomain contextual
type CreateDomainFn<T> = (a: Range<number>, b: Range<number>) => DomainFunction<T>;

export const domainFactory: {
  [K in UniformType]: CreateDomainFn<UniformValueMap[K]>;
} = {
  float: scalar.createDomainFn,
  int: (a: Range<number>, b: Range<number>) => {
    const fn = scalar.createDomainFn(a, b);
    return (x: number) => Math.round(fn(x));
  },
  vec4: (a: Range<number>, b: Range<number>) =>
    vec4.createDomainFn(
      { min: vec4.fromScalar(a.min), max: vec4.fromScalar(a.max) },
      { min: vec4.fromScalar(b.min), max: vec4.fromScalar(b.max) }
    ),
  vec3: (a: Range<number>, b: Range<number>) =>
    vec3.createDomainFn(
      { min: vec3.fromScalar(a.min), max: vec3.fromScalar(a.max) },
      { min: vec3.fromScalar(b.min), max: vec3.fromScalar(b.max) }
    ),
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
  custom: function (a: Range<number>, b: Range<number>): DomainFunction<unknown> {
    throw new Error("Function not implemented.");
  },
};
