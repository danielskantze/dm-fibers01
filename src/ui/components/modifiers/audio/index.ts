import type { ModifierComponent, ModifierComponentEventMap } from "..";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";

export interface AudioModifierProps {
  type: "audio";
}

export function createAudioModifier(props: AudioModifierProps): ModifierComponent {
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
  };
}
