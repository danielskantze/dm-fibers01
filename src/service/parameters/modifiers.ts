import { blenderFactory } from "../../math/generic/blending";
import { clamperFactory } from "../../math/generic/clamping";
import type { BlendFunction } from "../../math/types";
import type {
  MappedUniformValue,
  UniformType,
  UniformValue,
  UniformValueDomain,
} from "../../types/gl/uniforms";
import { generateId } from "../../ui/util/id";
import type { ManagedParameter } from "../parameters";
import type { AnyModifierConfig, BlendMode } from "./modifiers/types";

export type ParameterModifierTransformFn<T extends UniformType> = (
  frame: number,
  value: MappedUniformValue<T>
) => MappedUniformValue<T>;

export type ModifierType = "lfo" | "audio";

export interface ParameterModifierMapping {
  blendMode: BlendMode;
  range: number;
  offset: number;
}
export interface ParameterModifier<T extends UniformType> {
  readonly id: string;
  config: AnyModifierConfig;
  transform: ParameterModifierTransformFn<T>;
}

export interface BaseModifierConfig {
  type: ModifierType;
  offset: number;
  range: number;
  blendMode: BlendMode;
}

class ModifierError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export abstract class BaseModifier<T extends UniformType, C extends AnyModifierConfig>
  implements ParameterModifier<T>
{
  public readonly id: string;
  private _type: T;
  private _blendMode: BlendMode = "add";
  private _blendFn: BlendFunction<MappedUniformValue<T>>;
  private _domainScale: number;
  protected _modifierType: ModifierType;
  public offset: number = 0;
  public range: number = 1.0;

  constructor(id: string | undefined, type: T, domainScale: number, config: C) {
    this.id = id ?? generateId();
    this._type = type;
    this._blendMode = config.blendMode;
    this.offset = config.offset;
    this.range = config.range;
    this._domainScale = domainScale;
    this._modifierType = config.type;
    this._blendFn = blenderFactory[this._type]!(this._blendMode, domainScale);
  }
  public get type(): T {
    return this._type;
  }
  public set blendMode(newValue: BlendMode) {
    this._blendMode = newValue;
    this._blendFn = blenderFactory[this._type]!(newValue, this._domainScale);
  }
  protected getBaseConfig(): Omit<BaseModifierConfig, "type"> {
    return {
      blendMode: this._blendMode,
      offset: this.offset,
      range: this.range,
    };
  }

  protected abstract _getSpecificConfig(): Omit<C, keyof BaseModifierConfig>;

  public get config(): C {
    const base = this.getBaseConfig();
    const specific = this._getSpecificConfig();
    return { ...base, ...specific, type: this._modifierType } as C;
  }

  public set config(config: AnyModifierConfig) {
    if (config.type !== this._modifierType) {
      throw new Error(
        `Invalid config type: Expected '${this._modifierType}' but got '${config.type}'.`
      );
    }
    this._applyConfig(config as BaseModifierConfig);
    this._applySpecificConfig(config as C);
  }

  protected abstract _applySpecificConfig(config: C): void;

  private _applyConfig(config: BaseModifierConfig) {
    this._blendMode = config.blendMode;
    this.offset = config.offset;
    this.range = config.range;
    this.offset = config.offset;
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
