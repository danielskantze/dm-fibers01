import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type {
  AudioAnalysisModifierConfig,
  ScalarAnalysisProperty,
} from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import {
  type AnyModifierConfig,
  blendModeEnumMap,
} from "../../../../service/parameters/modifiers/types";
import {
  audioAnalysisTypeEnumMap,
  audioLevelAnalysisPropertyEnumMap,
  audioBeatAnalysisPropertyEnumMap,
  defaultAudioPropertyValueMap,
} from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";
import "./audio-modifier.css";
import { blendModeEnumLabelMap } from "../manager";
import type { ModifierHeaderComponent } from "../header";

export function createAudioModifier(
  initialConfig: AudioAnalysisModifierConfig,
  header: ModifierHeaderComponent
): ModifierComponent {
  let config = { ...initialConfig };
  config.analysis = { ...config.analysis };
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  const baseContainer = document.createElement("div");
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.classList.add("audio");
  container.classList.add("container");
  outerContainer.appendChild(container);
  baseContainer.classList.add("base");

  const scalarPropertyEnumLabelMap: { [K in ScalarAnalysisProperty]: string } = {
    lastBeatTime: "tBeat",
    timeSinceLastBeat: "ΔBeat",
    rms: "RMS",
    peak: "Peak",
    avgPeak: "P̄eak",
    avgRms: "R̄MS",
    avgRms3: "R̄MS3",
    avgRms5: "R̄MS5",
  };

  const bypassControl = createScalar({
    name: "Bypass",
    value: config.bypass ? 1 : 0,
    min: 0,
    max: 1.0,
    step: 1,
    type: "enum",
    enumValues: ["No", "Yes"],
    onChange: (value: number) => {
      config.bypass = value > 0;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

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

  const typeControl = createScalar({
    name: "Type",
    value: audioAnalysisTypeEnumMap.stringToInt(
      config.analysis.type as "levels" | "beat"
    ),
    type: "enum",
    enumValues: audioAnalysisTypeEnumMap.values,
    onChange: (value: number) => {
      const analysisType = audioAnalysisTypeEnumMap.intToString(value);
      config.analysis.type = analysisType;
      config.analysis.property = defaultAudioPropertyValueMap[analysisType];
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const levelPropertyControl = createScalar({
    name: "Property",
    value: audioLevelAnalysisPropertyEnumMap.stringToInt(config.analysis.property),
    type: "enum",
    enumValues: audioLevelAnalysisPropertyEnumMap.values.map(
      e => scalarPropertyEnumLabelMap[e]
    ),
    onChange: (value: number) => {
      config.analysis.property = audioLevelAnalysisPropertyEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  const beatPropertyControl = createScalar({
    name: "Property",
    value: audioBeatAnalysisPropertyEnumMap.stringToInt(config.analysis.property),
    type: "enum",
    enumValues: audioBeatAnalysisPropertyEnumMap.values.map(
      e => scalarPropertyEnumLabelMap[e]
    ),
    onChange: (value: number) => {
      config.analysis.property = audioBeatAnalysisPropertyEnumMap.intToString(value);
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  levelPropertyControl.element.classList.add("levels-property");
  beatPropertyControl.element.classList.add("beat-property");

  bypassControl.element.classList.add("base");
  rangeControl.element.classList.add("base");
  offsetControl.element.classList.add("base");
  delayControl.element.classList.add("base");
  durationControl.element.classList.add("base");
  blendControl.element.classList.add("base");

  // header
  container.appendChild(header.element);

  // base
  baseContainer.appendChild(bypassControl.element);
  baseContainer.appendChild(rangeControl.element);
  baseContainer.appendChild(offsetControl.element);
  baseContainer.appendChild(delayControl.element);
  baseContainer.appendChild(durationControl.element);
  baseContainer.appendChild(blendControl.element);

  // specific
  container.appendChild(typeControl.element);
  container.appendChild(levelPropertyControl.element);
  container.appendChild(beatPropertyControl.element);

  container.appendChild(baseContainer);

  container.dataset.analysisType = config.analysis.type as string;

  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AnyModifierConfig) => {
      if (newConfig.type !== "audio") {
        throw new Error(`Invalid modifier config: ${JSON.stringify(newConfig)}`);
      }
      config = { ...newConfig };
      config.analysis = { ...config.analysis };
      bypassControl.update(config.bypass ? 1 : 0);
      typeControl.update?.(
        audioAnalysisTypeEnumMap.stringToInt(config.analysis.type as "levels" | "beat")
      );
      levelPropertyControl.update?.(
        audioLevelAnalysisPropertyEnumMap.stringToInt(config.analysis.property)
      );
      beatPropertyControl.update?.(
        audioBeatAnalysisPropertyEnumMap.stringToInt(config.analysis.property)
      );
      container.dataset.analysisType = config.analysis.type as string;
      rangeControl.update?.(config.range);
      offsetControl.update?.(config.offset);
      delayControl.update?.(config.delay);
      durationControl.update?.(config.duration);
      blendControl.update?.(blendModeEnumMap.stringToInt(config.blendMode));
    },
  };
}
