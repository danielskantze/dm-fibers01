import { fps } from "../../config/constants";
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
import type { AnyModifierConfig, BlendMode } from "./modifiers/types";
import type { ManagedParameter } from "./parameter";

export type ParameterModifierTransformFn<T extends UniformType> = (
  frame: number,
  value: MappedUniformValue<T>
) => MappedUniformValue<T>;

export type ModifierType = "lfo" | "audio" | "smoother";

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
  bypass: boolean;
  type: ModifierType;
  offset: number;
  range: number;
  delay: number;
  duration: number;
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
  private _domainScale: number;
  protected _modifierType: ModifierType;
  private _blendMode: BlendMode = "add";
  private _blendFn: BlendFunction<MappedUniformValue<T>>;
  public offset: number = 0;
  public range: number = 1.0;
  public bypass: boolean = false;
  public delay: number = 0.0;
  public duration: number = 0.0;

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
      bypass: this.bypass,
      blendMode: this._blendMode,
      range: this.range,
      offset: this.offset,
      delay: this.delay,
      duration: this.duration,
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
    this.blendMode = config.blendMode;
    this.offset = config.offset;
    this.range = config.range;
    this.offset = config.offset;
    this.bypass = config.bypass;
    this.delay = config.delay;
    this.duration = config.duration;
  }

  generate(_frame: number): MappedUniformValue<T> {
    throw new ModifierError("Not implemented");
  }
  transform(frame: number, value: MappedUniformValue<T>): MappedUniformValue<T> {
    if (this.bypass) {
      return value;
    }
    const startFrame = this.delay * fps;
    if (frame < startFrame) {
      return value;
    }
    if (this.duration > 0 && frame > startFrame + this.duration * fps) {
      return value;
    }
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
