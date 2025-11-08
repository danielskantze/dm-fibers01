import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type { AudioAnalysisModifierConfig } from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import {
  type AnyModifierConfig,
  blendModeEnumMap,
} from "../../../../service/parameters/modifiers/types";
import {
  scalarAnalysisTypeEnumMap,
  scalarAnalysisPropertyEnumMap,
} from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";

export function createAudioModifier(
  initialConfig: AudioAnalysisModifierConfig
): ModifierComponent {
  let config = { ...initialConfig };
  config.analysis = { ...config.analysis };
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.appendChild(container);

  const typeControl = createScalar({
    name: "Type",
    value: scalarAnalysisTypeEnumMap.stringToInt(
      config.analysis.type as "levels" | "beat"
    ),
    type: "enum",
    enumValues: scalarAnalysisTypeEnumMap.values,
    onChange: (value: number) => {
      config.analysis.type = scalarAnalysisTypeEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const propertyControl = createScalar({
    name: "Property",
    value: scalarAnalysisPropertyEnumMap.stringToInt(config.analysis.property),
    type: "enum",
    enumValues: scalarAnalysisPropertyEnumMap.values,
    onChange: (value: number) => {
      config.analysis.property = scalarAnalysisPropertyEnumMap.intToString(value);
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
    enumValues: blendModeEnumMap.values,
    onChange: (value: number) => {
      config.blendMode = blendModeEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  container.appendChild(typeControl.element);
  container.appendChild(propertyControl.element);
  container.appendChild(rangeControl.element);
  container.appendChild(offsetControl.element);
  container.appendChild(blendControl.element);

  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AnyModifierConfig) => {
      if (newConfig.type !== "audio") {
        throw new Error(`Invalid modifier config: ${JSON.stringify(newConfig)}`);
      }
      config = { ...newConfig };
      config.analysis = { ...config.analysis };
      typeControl.update?.(
        scalarAnalysisTypeEnumMap.stringToInt(config.analysis.type as "levels" | "beat")
      );
      propertyControl.update?.(
        scalarAnalysisPropertyEnumMap.stringToInt(config.analysis.property)
      );
      rangeControl.update?.(config.range);
      offsetControl.update?.(config.offset);
      blendControl.update?.(blendModeEnumMap.stringToInt(config.blendMode));
    },
  };
}
