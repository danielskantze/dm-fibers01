import type { UniformValue } from "../../types/gl/uniforms";
import { type ParameterData, type ParameterModifier } from "../parameters";

const fps: number = 60;

type Props = {
  hz: number;
  min: number;
  max: number;
  curve: "sine";
};

export function createLFO(props: Props): ParameterModifier {
  const { hz, min, max, curve } = props;
  const range = max - min;
  function transformSine(
    frame: number,
    data: ParameterData,
    value: UniformValue
  ): UniformValue {
    if (data.type && data.type !== "float") {
      return value;
    }
    const x = frame / fps;
    const y = Math.sin(hz * x * Math.PI * 2.0) * range + min;
    return (value as number) + y;
  }

  let transform = transformSine;
  switch (curve) {
    case "sine":
      transform = transformSine;
  }

  return {
    transform,
  };
}
