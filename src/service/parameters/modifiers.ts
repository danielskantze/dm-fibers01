import { blenderFactory } from "../../math/generic/blending";
import { clamperFactory } from "../../math/generic/clamping";
import type { BlendFunction, BlendMode } from "../../math/types";
import type {
  MappedUniformValue,
  UniformType,
  UniformValue,
  UniformValueDomain,
} from "../../types/gl/uniforms";
import type { ManagedParameter } from "../parameters";

export type ParameterModifierTransformFn<T extends UniformType> = (
  frame: number,
  value: MappedUniformValue<T>
) => MappedUniformValue<T>;

export interface ParameterModifierMapping {
  blendMode: BlendMode;
  range: number;
  offset: number;
}
export interface ParameterModifier<T extends UniformType> {
  transform: ParameterModifierTransformFn<T>;
}

class ModifierError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BaseModifier<T extends UniformType> implements ParameterModifier<T> {
  private _type: T;
  private _blendMode: BlendMode = "add";
  private _blendFn: BlendFunction<MappedUniformValue<T>>;
  private _domainScale: number;
  public offset: number = 0;
  public range: number = 1.0;

  constructor(type: T, domainScale: number) {
    this._type = type;
    this._domainScale = domainScale;
    this._blendFn = blenderFactory[this._type]!(this._blendMode, domainScale);
  }
  public get type(): T {
    return this._type;
  }
  public set blendMode(newValue: BlendMode) {
    this._blendMode = newValue;
    this._blendFn = blenderFactory[this._type]!(newValue, this._domainScale);
  }
  generate(_frame: number): MappedUniformValue<T> {
    throw new ModifierError("Not implemented");
  }
  transform(frame: number, value: MappedUniformValue<T>): MappedUniformValue<T> {
    const signal = this.generate(frame);
    const blended = this._blendFn(value, signal);
    return blended;
  }
}

function _computeValue<T extends UniformType>(
  type: T,
  frame: number,
  baseValue: MappedUniformValue<T>,
  modifiers: ParameterModifier<T>[],
  domain: UniformValueDomain
) {
  let value = baseValue;
  if (modifiers.length === 0) {
    return value;
  }
  // FIXME: Check for INT type -> Convert to float type (for internal processing)
  for (const modifier of modifiers) {
    value = modifier.transform(frame, value);
  }
  // FIXME: Check for INT type -> Convert to int type (for target)
  const clamper = clamperFactory[type];
  if (clamper) {
    value = clamper(value, domain.min, domain.max);
  }
  return value;
}
export function computeValue(frame: number, parameter: ManagedParameter): UniformValue {
  return _computeValue(
    parameter.data.type ?? "float",
    frame,
    parameter.baseValue,
    parameter.modifiers,
    parameter.data.domain
  ) as UniformValue;
}
