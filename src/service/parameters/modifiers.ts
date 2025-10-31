import { clamp as clampScalar } from "../../math/scalar";
import { clamp as clampIScalar } from "../../math/iscalar";
import { clampS as clampVec3S } from "../../math/vec3";
import { clampS as clampVec4S } from "../../math/vec4";
import { clampS as clampMat3S } from "../../math/mat3";
import { clampS as clampMat4S } from "../../math/mat4";
import { clampS as clampMat43S } from "../../math/mat43";

import type { UniformType, UniformValue } from "../../types/gl/uniforms";
import type { ManagedParameter } from "../parameters";

export type ParameterModifierTransformFn = (
  frame: number,
  value: UniformValue
) => UniformValue;

export interface ParameterModifierMapping {
  blendMode: "add" | "multiply";
  range: number;
  offset: number;
}
export interface ParameterModifier {
  mapping: ParameterModifierMapping;
  transform: ParameterModifierTransformFn;
}

type ClampFn = (value: any, min: number, max: number) => any;

const clampers: Partial<Record<UniformType, ClampFn>> = {
  float: clampScalar,
  int: clampIScalar,
  vec3: clampVec3S,
  vec4: clampVec4S,
  mat3: clampMat3S,
  mat4: clampMat4S,
  mat43: clampMat43S,
};

export function applyModifier(
  frame: number,
  modifier: ParameterModifier,
  value: UniformValue
): UniformValue {
  return modifier.transform(frame, value);
}

export function computeValue(frame: number, parameter: ManagedParameter) {
  let value = parameter.baseValue;
  if (parameter.modifiers.length === 0) {
    return value;
  }
  for (const m of parameter.modifiers) {
    value = applyModifier(frame, m, value);
  }
  const clamper = clampers[parameter.data.type!];
  if (clamper) {
    value = clamper(value, parameter.data.domain.min, parameter.data.domain.max);
  }
  return value;
}
