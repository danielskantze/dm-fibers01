import type { ModifierComponent, ModifierComponentEventMap } from "..";
import {
  type AnyModifierConfig,
  blendModeEnumMap,
} from "../../../../service/parameters/modifiers/types";
import { lfoCurveEnumMap } from "../../../../service/parameters/modifiers/lfo-modifier";
import type {
  LFOConfig,
  LFOCurve,
} from "../../../../service/parameters/modifiers/lfo-modifier";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";
import "./lfo-modifier.css";
import { blendModeEnumLabelMap } from "../manager";
import { createModifierHeader } from "../header";
import lfoIcon from "../../../icons/lfo.svg?raw";

const lfoCurveEnumLabelMap: { [K in LFOCurve]: string } = {
  sine: "Sin",
  triangle: "Tri",
  square: "Sqr",
};

export function createLFOModifier(initialConfig: LFOConfig): ModifierComponent {
  let config = { ...initialConfig };
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  const header = createModifierHeader("LFO", lfoIcon);
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.classList.add("lfo");
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
    value: blendModeEnumMap.stringToInt(config.blendMode),
    type: "enum",
    enumValues: blendModeEnumMap.values.map(v => blendModeEnumLabelMap[v]),
    onChange: (value: number) => {
      config.blendMode = blendModeEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const curveControl = createScalar({
    name: "Curve",
    value: lfoCurveEnumMap.stringToInt(config.curve),
    type: "enum",
    enumValues: lfoCurveEnumMap.values.map(v => lfoCurveEnumLabelMap[v]),
    onChange: (value: number) => {
      config.curve = lfoCurveEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  container.appendChild(header.element);
  container.appendChild(hzControl.element);
  container.appendChild(rangeControl.element);
  container.appendChild(offsetControl.element);
  container.appendChild(phaseControl.element);
  container.appendChild(curveControl.element);
  container.appendChild(blendControl.element);
  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AnyModifierConfig) => {
      if (newConfig.type !== "lfo") {
        throw new Error(`Invalid modifier config: ${JSON.stringify(newConfig)}`);
      }
      config = { ...newConfig };
      hzControl.update?.(config.hz);
      rangeControl.update?.(config.range);
      phaseControl.update?.(config.phase);
      offsetControl.update?.(config.offset);
      blendControl.update?.(blendModeEnumMap.stringToInt(config.blendMode));
      curveControl.update?.(lfoCurveEnumMap.stringToInt(config.curve));
    },
  };
}
