import type { UniformType, UniformValue } from "../types/gl/uniforms";
import * as vec3 from "../math/vec3";
import * as vec4 from "../math/vec4";
import * as mat3 from "../math/mat3";
import * as mat4 from "../math/mat4";
import * as mat43 from "../math/mat43";

export function createFromJson(
  value: UniformValue,
  type: UniformType | undefined
): UniformValue {
  switch (type) {
    case "vec3":
      return vec3.create(value as any);
    case "vec4":
      return vec4.create(value as any);
    case "mat3":
      return mat3.create(value as any);
    case "mat43":
      return mat43.create(value as any);
    case "mat4":
      return mat4.create(value as any);
    default:
      return value;
  }
}

export function valueToJson(
  value: UniformValue | undefined,
  _type: UniformType | undefined
): any {
  if (value instanceof Float32Array) {
    return Array.from(value);
  }
  return value;
}
