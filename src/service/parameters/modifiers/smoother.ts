import { smoothingFactory } from "../../../math/generic/smoothing";
import type { BlendFunction } from "../../../math/types";
import {
  type MappedUniformValue,
  type UniformType,
  type UniformValueDomain,
} from "../../../types/gl/uniforms";
import { BaseModifier, type BaseModifierConfig } from "../modifiers";

export interface SmootherConfig extends BaseModifierConfig {
  type: "smoother";
  strength: number;
}

const defaultConfig: SmootherConfig = {
  type: "smoother",
  strength: 0.001,
  bypass: false,
  offset: 0,
  range: 0,
  delay: 0,
  duration: 0,
  blendMode: "overwrite",
};

export class SmootherModifier<T extends UniformType> extends BaseModifier<
  T,
  SmootherConfig
> {
  public strength: number = 0.0;
  private _currentValue: MappedUniformValue<T> | null = null;
  private _transformFn: BlendFunction<MappedUniformValue<T>>;
  private _uniformType: T;

  constructor(
    id: string | undefined,
    type: T,
    domain: UniformValueDomain,
    config: Partial<SmootherConfig>
  ) {
    const fullConfig = { ...defaultConfig, ...config };
    super(id, type, domain.max - domain.min, fullConfig);
    this._uniformType = type;
    this._transformFn = smoothingFactory[this._uniformType](fullConfig.strength);
  }

  protected _applySpecificConfig(config: SmootherConfig): void {
    this.strength = config.strength;
    this._transformFn = smoothingFactory[this._uniformType](config.strength);
  }

  protected _getSpecificConfig(): Omit<SmootherConfig, keyof BaseModifierConfig> {
    return {
      strength: this.strength,
    };
  }

  override transform(
    _frame: number,
    value: MappedUniformValue<T>
  ): MappedUniformValue<T> {
    const smoothed = this._transformFn(value, this._currentValue ?? value);
    this._currentValue = smoothed;
    return this.bypass ? value : smoothed;
  }
}
