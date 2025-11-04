import type { ModifierProps } from "..";
import { createScalar, type ScalarProps } from "../../scalar";
import type { Component } from "../../types";

export interface LFOModifierProps extends ModifierProps {
  type: "lfo";
}

export function createLFOModifier(props: LFOModifierProps): Component {
  const container = document.createElement("div");
  const hzControl = createScalar({
    name: "lfo",
    value: 0,
  } as ScalarProps);
  container.appendChild(hzControl.element);
  return {
    element: container,
  };
}
