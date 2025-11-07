import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type { AudioAnalysisModifierConfig } from "../../../../service/parameters/modifiers/audio-analysis-modifier";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";

export function createAudioModifier(
  config: AudioAnalysisModifierConfig
): ModifierComponent {
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.appendChild(container);

  const hzControl = createScalar({
    name: "audio",
    value: 0,
  } as ScalarProps);
  container.appendChild(hzControl.element);
  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AudioAnalysisModifierConfig) => {
      // TODO
    },
  };
}
