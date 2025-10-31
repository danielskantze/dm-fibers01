import { fps } from "../../config/constants";
import { clamp, createDomainMapping, frac, type ScalarMapFn } from "../../math/scalar";
import {
  UniformFloatTypes,
  UniformIntTypes,
  type UniformType,
  type UniformValueDomain,
} from "../../types/gl/uniforms";
import { StreamLogging } from "../../util/logging";
import {
  type ParameterModifier,
  type ParameterModifierMapping,
  type ParameterModifierTransformFn,
} from "./modifiers";
import { ModifierTypeException } from "./types";

type Props = {
  hz: number;
  range: number;
  offset?: number;
  phase?: number;
  curve: "sine" | "square" | "triangle";
  domain: UniformValueDomain;
  type: UniformType;
};

export function createScalarLFO(
  props: Props,
  mapping: ParameterModifierMapping
): ParameterModifier {
  const { hz, curve, domain, type } = props;
  let { range, offset, phase } = props;
  if (!UniformFloatTypes.includes(type) && !UniformIntTypes.includes(type)) {
    throw new ModifierTypeException("Unsupported type (only float supported right now)");
  }
  const distance = domain.max - domain.min;
  range = clamp(range, 0, 1);
  offset = clamp(offset ?? 0, -1, 1);
  phase = phase ?? 0;
  phase = phase > 0 ? phase % 1 : 1 + (phase % 1);
  const delta = range * distance;
  let { map } = createDomainMapping(
    { min: -1.0, max: 1.0 },
    {
      min: -delta * 0.5 * (1 - offset),
      max: delta * 0.5 * (1 + offset),
    }
  );
  let transform: ParameterModifierTransformFn;
  switch (curve) {
    case "sine":
      transform = (frame, value) => {
        const t = frame / fps;
        const y = Math.sin((hz * t + phase) * Math.PI * 2.0);
        StreamLogging.addOrlog("simulate.maxRadius(sine)", 10, [map(y).toFixed(2)]);
        return (value as number) + map(y);
      };
      break;
    case "square":
      const divider = fps / hz;
      const shift = phase * divider;
      transform = (frame, value) => {
        const y = frac((frame + shift) / (fps / hz)) > 0.5 ? 1 : -1;
        StreamLogging.addOrlog("simulate.maxRadius(square)", 10, [map(y).toFixed(2)]);
        return (value as number) + map(y);
      };
      break;
    case "triangle":
      transform = (frame, value) => {
        const p = ((hz * (phase + frame)) / fps) % 1;
        let y = 0;
        if (p < 0.25) {
          y = p / 0.25;
        } else if (p < 0.75) {
          y = 1.0 - (2.0 * (p - 0.25)) / 0.5;
        } else {
          y = -1.0 + (p - 0.75) / 0.25;
        }
        StreamLogging.addOrlog("simulate.maxRadius(triangle)", 10, [map(y).toFixed(2)]);
        return (value as number) + map(y);
      };
      break;
  }

  return {
    transform,
    mapping: {
      blendMode: "add",
      offset,
      range,
    },
  };
}
