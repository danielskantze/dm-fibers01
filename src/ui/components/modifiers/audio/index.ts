import { createScalar, type ScalarProps } from "../../scalar";
import type { Component } from "../../types";

export interface AudioModifierProps {
  type: "audio";
}

export function createAudioModifier(props: AudioModifierProps): Component {
  const container = document.createElement("div");
  const hzControl = createScalar({
    name: "audio",
    value: 0,
  } as ScalarProps);
  container.appendChild(hzControl.element);
  return {
    element: container,
  };
}
