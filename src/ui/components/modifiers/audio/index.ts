import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type { BlendMode } from "../../../../math/types";
import type {
  AudioAnalysisModifierConfig,
  ScalarAnalysisProperty,
  ScalarAnalysisType,
} from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import type { AnyModifierConfig } from "../../../../service/parameters/modifiers/types";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";

function analysisTypeToInt(type: ScalarAnalysisType): number {
  switch (type) {
    case "levels":
      return 0;
    case "beat":
      return 0;
    default:
      return 0;
  }
}

function intToAnalysisType(value: number): ScalarAnalysisType {
  switch (value) {
    case 0:
      return "levels";
    case 1:
      return "beat";
    default:
      return "levels";
  }
}

function propertyToInt(property: ScalarAnalysisProperty): number {
  switch (property) {
    case "peak":
      return 0;
    case "avgPeak":
      return 1;
    case "rms":
      return 2;
    case "avgRms":
      return 3;
    case "avgRms3":
      return 4;
    case "avgRms5":
      return 5;
    default:
      return 3;
  }
}

function intToProperty(value: number): ScalarAnalysisProperty {
  switch (value) {
    case 0:
      return "peak";
    case 1:
      return "avgPeak";
    case 2:
      return "rms";
    case 3:
      return "avgRms";
    case 4:
      return "avgRms3";
    case 5:
      return "avgRms5";
    default:
      return "avgRms";
  }
}

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
    value: analysisTypeToInt(config.analysis.type),
    min: 0,
    max: 1,
    type: "enum",
    enumValues: ["levels", "beat"],
    onChange: (value: number) => {
      config.analysis.type = intToAnalysisType(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const propertyControl = createScalar({
    name: "Property",
    value: propertyToInt(config.analysis.property),
    min: 0,
    max: 6,
    type: "enum",
    enumValues: ["peak", "avgPeak", "rms", "avgRms", "avgRms3", "avgRms5"],
    onChange: (value: number) => {
      config.analysis.property = intToProperty(value);
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
      typeControl.update?.(analysisTypeToInt(config.analysis.type));
      propertyControl.update?.(propertyToInt(config.analysis.property));
      rangeControl.update?.(config.range);
      offsetControl.update?.(config.offset);
      blendControl.update?.(blendModeToInt(config.blendMode));
    },
  };
}
