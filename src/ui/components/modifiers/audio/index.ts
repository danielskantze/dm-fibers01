import { createScalar, type ScalarProps } from "../../scalar";
import type { ComponentWithoutEvents } from "../../types";

export interface AudioModifierProps {
  type: "audio";
}

export function createAudioModifier(props: AudioModifierProps): ComponentWithoutEvents {
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
  };
}
