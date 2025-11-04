import type { ModifierProps } from "..";
import type { BlendMode } from "../../../../math/types";
import type {
  LFOConfig,
  LFOCurve,
} from "../../../../service/parameters/modifiers/lfo-modifier";
import { createScalar, type ScalarProps } from "../../scalar";
import type { ComponentWithoutEvents } from "../../types";
import "../modifier.css";

export interface LFOModifierProps extends ModifierProps {
  type: "lfo";
  config: LFOConfig;
}

function blendModeToInt(blendMode: BlendMode): number {
  switch (blendMode) {
    case "add":
      return 0;
    case "multiply":
      return 1;
  }
}

function curveToInt(curve: LFOCurve): number {
  switch (curve) {
    case "sine":
      return 0;
    case "triangle":
      return 1;
    case "square":
      return 2;
  }
}

export function createLFOModifier(props: LFOModifierProps): ComponentWithoutEvents {
  const { config } = props;
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.appendChild(container);
  container.classList.add("container");

  const hzControl = createScalar({
    name: "Hz",
    value: config.hz,
    min: 0,
    max: 30,
  } as ScalarProps);

  const rangeControl = createScalar({
    name: "Range",
    value: config.range,
    min: 0,
    max: 1,
  } as ScalarProps);

  const phaseControl = createScalar({
    name: "Phase",
    value: config.phase,
    min: -1,
    max: 1,
  } as ScalarProps);

  const offsetControl = createScalar({
    name: "Shift",
    value: config.offset,
    min: -1,
    max: 1,
  } as ScalarProps);

  const blendControl = createScalar({
    name: "Blend",
    value: blendModeToInt(config.blendMode),
    min: 0,
    max: 1,
    type: "enum",
    enumValues: ["add", "multiply"],
  } as ScalarProps);

  const curveControl = createScalar({
    name: "Curve",
    value: curveToInt(config.curve),
    min: 0,
    max: 2,
    type: "enum",
    enumValues: ["sine", "triangle", "square"],
  } as ScalarProps);

  container.appendChild(hzControl.element);
  container.appendChild(rangeControl.element);
  container.appendChild(offsetControl.element);
  container.appendChild(phaseControl.element);
  container.appendChild(curveControl.element);
  container.appendChild(blendControl.element);
  return {
    element: outerContainer,
  };
}
