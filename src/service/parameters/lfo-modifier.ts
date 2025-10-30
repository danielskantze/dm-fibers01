import { clamp, createDomainMapping, frac } from "../../math/scalar";
import type { UniformType, UniformValueDomain } from "../../types/gl/uniforms";
import { type ParameterModifier, type ParameterModifierTransformFn } from "../parameters";
import { ModifierTypeException } from "./types";

const fps: number = 60;

type Props = {
  hz: number;
  range: number;
  offset?: number;
  phase?: number;
  curve: "sine" | "square";
  domain: UniformValueDomain;
  type: UniformType;
};

export function createScalarLFO(props: Props): ParameterModifier {
  const { hz, curve, domain, type } = props;
  let { range, offset, phase } = props;
  if (type !== "float") {
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
      min: -delta * range * (1 - offset),
      max: delta * range * (1 + offset),
    }
  );
  let transform: ParameterModifierTransformFn;
  switch (curve) {
    case "sine":
      transform = (frame, value) => {
        const t = frame / fps;
        const y = Math.sin((hz * t + phase) * Math.PI * 2.0);
        return clamp((value as number) + map(y), domain.min, domain.max);
      };
      break;
    case "square":
      const divider = fps / hz;
      const shift = phase * divider;
      transform = (frame, value) => {
        const y = frac((frame + shift) / (fps / hz)) > 0.5 ? 1 : -1;
        return clamp((value as number) + map(y), domain.min, domain.max);
      };
  }

  return {
    transform,
  };
}
