import { fps } from "../../../config/constants";
import { fromScalarToFloatFactory } from "../../../math/generic/creation";
import { frac } from "../../../math/scalar";
import {
  type MappedUniformValue,
  type UniformType,
  type UniformValueDomain,
} from "../../../types/gl/uniforms";
import type { Parameter } from "../../parameters";
import { BaseModifier } from "../modifiers";

export type LFOCurve = "sine" | "square" | "triangle";

type GenerateFn<T extends UniformType> = (frame: number) => MappedUniformValue<T>;

type LFOProps = {
  curve: LFOCurve;
  hz: number;
  phase: number;
  offset: number;
  range: number;
};

const defaultConfig: LFOProps = {
  curve: "sine",
  hz: 1.0,
  phase: 0.0,
  offset: 0.0,
  range: 0.25,
};

export class LFOModifier<T extends UniformType> extends BaseModifier<T> {
  public _curve: LFOCurve;
  public hz: number;
  public phase: number;
  private _generateFn: GenerateFn<T>;

  constructor(
    type: T,
    domain: UniformValueDomain,
    curve: LFOCurve,
    hz: number,
    phase: number,
    offset: number,
    range: number
  ) {
    super(type, domain.max - domain.min);
    this.offset = offset; // expect this to be inside domain
    this.range = range; // 0 - 1
    this._curve = curve;
    this.hz = hz;
    this.phase = phase;
    this._generateFn = this._createGenerateFn(curve);
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
    config: Partial<LFOProps>
  ): LFOModifier<UniformType> {
    const { type, domain } = p.data;
    const { curve, hz, phase, range, offset } = { ...defaultConfig, ...config };
    return new LFOModifier<UniformType>(type!, domain, curve, hz, phase, offset, range);
  }
}
