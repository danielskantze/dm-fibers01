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
import type { ModifierHeaderComponent } from "../header";

const lfoCurveEnumLabelMap: { [K in LFOCurve]: string } = {
  sine: "Sin",
  triangle: "Tri",
  square: "Sqr",
};

export function createLFOModifier(
  initialConfig: LFOConfig,
  header: ModifierHeaderComponent
): ModifierComponent {
  let config = { ...initialConfig };
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  const baseContainer = document.createElement("div");

  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.classList.add("lfo");
  outerContainer.appendChild(container);
  container.classList.add("container");
  baseContainer.classList.add("base");

  // const bypassControl = createScalar({
  //   name: "Bypass",
  //   value: config.bypass ? 1 : 0,
  //   min: 0,
  //   max: 1.0,
  //   step: 1,
  //   type: "enum",
  //   enumValues: ["No", "Yes"],
  //   onChange: (value: number) => {
  //     config.bypass = value > 0;
  //     emitter.emit("change", { config });
  //   },
  // } as ScalarProps);

  const rangeControl = createScalar({
    name: "Range",
    value: config.range,
    min: -1,
    max: 1,
    onChange: (value: number) => {
      config.range = value;
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

  const delayControl = createScalar({
    name: "Delay",
    value: config.delay,
    min: 0,
    max: 600,
    onChange: (value: number) => {
      config.delay = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const durationControl = createScalar({
    name: "Duration",
    value: config.duration,
    min: 0,
    max: 600,
    onChange: (value: number) => {
      config.duration = value;
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

  // bypassControl.element.classList.add("base");
  rangeControl.element.classList.add("base");
  offsetControl.element.classList.add("base");
  delayControl.element.classList.add("base");
  durationControl.element.classList.add("base");
  blendControl.element.classList.add("base");

  // header
  container.appendChild(header.element);
  header.setBypass(config.bypass);
  outerContainer.classList.toggle("bypass", config.bypass);
  header.setOnBypass((value: boolean) => {
    config.bypass = value;
    outerContainer.classList.toggle("bypass", config.bypass);
    emitter.emit("change", { config });
  });

  // specific
  container.appendChild(hzControl.element);
  container.appendChild(phaseControl.element);
  container.appendChild(curveControl.element);

  // base
  // baseContainer.appendChild(bypassControl.element);
  baseContainer.appendChild(rangeControl.element);
  baseContainer.appendChild(offsetControl.element);
  baseContainer.appendChild(delayControl.element);
  baseContainer.appendChild(durationControl.element);
  baseContainer.appendChild(blendControl.element);

  container.appendChild(baseContainer);

  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AnyModifierConfig) => {
      if (newConfig.type !== "lfo") {
        throw new Error(`Invalid modifier config: ${JSON.stringify(newConfig)}`);
      }
      config = { ...newConfig };
      // bypassControl.update?.(config.bypass ? 1 : 0);
      header.setBypass(config.bypass);
      hzControl.update?.(config.hz);
      rangeControl.update?.(config.range);
      phaseControl.update?.(config.phase);
      offsetControl.update?.(config.offset);
      delayControl.update?.(config.delay);
      durationControl.update?.(config.duration);
      blendControl.update?.(blendModeEnumMap.stringToInt(config.blendMode));
      curveControl.update?.(lfoCurveEnumMap.stringToInt(config.curve));
    },
  };
}
