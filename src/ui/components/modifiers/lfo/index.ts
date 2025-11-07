import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type { BlendMode } from "../../../../math/types";
import type {
  LFOConfig,
  LFOCurve,
} from "../../../../service/parameters/modifiers/lfo-modifier";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";
import "../modifier.css";

function blendModeToInt(blendMode: BlendMode): number {
  switch (blendMode) {
    case "add":
      return 0;
    case "multiply":
      return 1;
  }
}

function intToBlendMode(value: number): BlendMode {
  switch (value) {
    case 0:
      return "add";
    case 1:
      return "multiply";
    default:
      return "add";
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

function intToCurve(value: number): LFOCurve {
  switch (value) {
    case 0:
      return "sine";
    case 1:
      return "triangle";
    case 2:
      return "square";
    default:
      return "sine";
  }
}

export function createLFOModifier(initialConfig: LFOConfig): ModifierComponent {
  let config = { ...initialConfig };
  const emitter = new Emitter<ModifierComponentEventMap>();
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
    max: 2.0,
    onChange: (value: number) => {
      config.hz = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const rangeControl = createScalar({
    name: "Range",
    value: config.range,
    min: 0,
    max: 1,
    onChange: (value: number) => {
      config.range = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const phaseControl = createScalar({
    name: "Phase",
    value: config.phase,
    min: -1,
    max: 1,
    onChange: (value: number) => {
      config.phase = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const offsetControl = createScalar({
    name: "Shift",
    value: config.offset,
    min: -1,
    max: 1,
    onChange: (value: number) => {
      config.offset = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const blendControl = createScalar({
    name: "Blend",
    value: blendModeToInt(config.blendMode),
    min: 0,
    max: 1,
    type: "enum",
    enumValues: ["add", "multiply"],
    onChange: (value: number) => {
      config.blendMode = intToBlendMode(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const curveControl = createScalar({
    name: "Curve",
    value: curveToInt(config.curve),
    min: 0,
    max: 2,
    type: "enum",
    enumValues: ["sine", "triangle", "square"],
    onChange: (value: number) => {
      config.curve = intToCurve(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  container.appendChild(hzControl.element);
  container.appendChild(rangeControl.element);
  container.appendChild(offsetControl.element);
  container.appendChild(phaseControl.element);
  container.appendChild(curveControl.element);
  container.appendChild(blendControl.element);
  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: LFOConfig) => {
      config = { ...newConfig };
      hzControl.update?.(config.hz);
      rangeControl.update?.(config.range);
      phaseControl.update?.(config.phase);
      offsetControl.update?.(config.offset);
      blendControl.update?.(blendModeToInt(config.blendMode));
      curveControl.update?.(curveToInt(config.curve));
      //emitter.emit("change", { config });
    },
  };
}
