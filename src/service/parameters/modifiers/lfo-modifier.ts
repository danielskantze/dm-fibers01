import { fps } from "../../../config/constants";
import { fromScalarToFloatFactory } from "../../../math/generic/creation";
import { frac } from "../../../math/scalar";
import {
  type MappedUniformValue,
  type UniformType,
  type UniformValueDomain,
} from "../../../types/gl/uniforms";
import { createEnumMap } from "../../../util/enum";
import type { Parameter } from "../../parameters";
import { BaseModifier, type BaseModifierConfig } from "../modifiers";

export type LFOCurve = "sine" | "square" | "triangle";

export const lfoCurveEnumMap = createEnumMap<LFOCurve>(["sine", "triangle", "square"]);

type GenerateFn<T extends UniformType> = (frame: number) => MappedUniformValue<T>;

export interface LFOConfig extends BaseModifierConfig {
  type: "lfo";
  curve: LFOCurve;
  hz: number;
  phase: number;
}

const defaultConfig: LFOConfig = {
  type: "lfo",
  curve: "sine",
  hz: 0.1,
  phase: 0.0,
  offset: 0.0,
  range: 0.25,
  blendMode: "add",
};

export class LFOModifier<T extends UniformType> extends BaseModifier<T, LFOConfig> {
  public _curve: LFOCurve;
  public hz: number;
  public phase: number;
  private _generateFn: GenerateFn<T>;

  constructor(
    id: string | undefined,
    type: T,
    domain: UniformValueDomain,
    config: LFOConfig
  ) {
    super(id, type, domain.max - domain.min, config);
    this.offset = config.offset; // expect this to be inside domain
    this.range = config.range; // 0 - 1
    this._curve = config.curve;
    this.hz = config.hz;
    this.phase = config.phase;
    this._generateFn = this._createGenerateFn(config.curve);
  }

  protected _applySpecificConfig(config: LFOConfig): void {
    this._curve = config.curve;
    this.hz = config.hz;
    this.phase = config.phase;
    this._generateFn = this._createGenerateFn(this._curve);
  }

  protected _getSpecificConfig(): Omit<LFOConfig, keyof BaseModifierConfig> {
    return {
      curve: this._curve,
      hz: this.hz,
      phase: this.phase,
    };
  }

  private _createGenerateFn(curve: LFOCurve): GenerateFn<T> {
    let generate: (frame: number) => number;
    switch (curve) {
      case "sine":
        generate = (frame: number) => {
          const v =
            this.offset +
            this.range * Math.sin((this.hz * (frame / fps) + this.phase) * Math.PI * 2.0);
          return v;
        };
        break;
      case "square":
        generate = (frame: number) => {
          const v =
            frac((frame + (this.phase * fps) / this.hz) / (fps / this.hz)) > 0.5
              ? this.offset + this.range
              : this.offset - this.range;
          return v;
        };
        break;
      case "triangle":
        generate = (frame: number) => {
          // TODO: FIX!
          const p = ((this.hz * (this.phase + frame)) / fps) % 1;
          let y = 0;
          if (p < 0.25) {
            y = p / 0.25;
          } else if (p < 0.75) {
            y = 1.0 - (2.0 * (p - 0.25)) / 0.5;
          } else {
            y = -1.0 + (p - 0.75) / 0.25;
          }
          return this.offset + this.range * y;
        };
        break;
    }
    return (frame: number) => fromScalarToFloatFactory[this.type](generate(frame));
  }

  public get curve(): LFOCurve {
    return this._curve;
  }

  public set curve(value: LFOCurve) {
    this._curve = value;
    this._generateFn = this._createGenerateFn(value);
  }

  generate(frame: number): MappedUniformValue<T> {
    return this._generateFn(frame);
  }

  static fromParameter(
    p: Parameter,
    config: Partial<LFOConfig>,
    id?: string
  ): LFOModifier<UniformType> {
    const { type, domain } = p.data;
    const lfoConfig = { ...defaultConfig, ...config };
    return new LFOModifier<UniformType>(id, type!, domain, lfoConfig);
  }
  static addTo(p: Parameter, config: Partial<LFOConfig>, id?: string) {
    const { type, domain } = p.data;
    const lfoConfig = { ...defaultConfig, ...config };
    p.addModifier(new LFOModifier<UniformType>(id, type!, domain, lfoConfig));
  }
}
