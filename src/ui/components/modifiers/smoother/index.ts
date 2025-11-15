import type { ModifierComponent, ModifierComponentEventMap } from "..";
import type { SmootherConfig } from "../../../../service/parameters/modifiers/smoother";
import { type AnyModifierConfig } from "../../../../service/parameters/modifiers/types";
import { Emitter } from "../../../../util/events";
import { createScalar, type ScalarProps } from "../../scalar";
import type { ModifierHeaderComponent } from "../header";
import "./smoother-modifier.css";

export function createSmootherModifier(
  initialConfig: SmootherConfig,
  header: ModifierHeaderComponent
): ModifierComponent {
  let config = { ...initialConfig };
  const emitter = new Emitter<ModifierComponentEventMap>();
  const outerContainer = document.createElement("div");
  const container = document.createElement("div");
  outerContainer.classList.add("ui-component");
  outerContainer.classList.add("modifier");
  outerContainer.classList.add("smoother");
  container.classList.add("container");
  outerContainer.appendChild(container);

  const strengthControl = createScalar({
    name: "Strength",
    value: config.strength,
    min: 0,
    max: 1.0,
    onChange: (value: number) => {
      config.strength = value;
      emitter.emit("change", { config });
    },
  } as ScalarProps);

  strengthControl.element.classList.add("smoother-property");

  // header
  container.appendChild(header.element);
  header.setBypass(config.bypass);
  outerContainer.classList.toggle("bypass", config.bypass);
  header.setOnBypass((value: boolean) => {
    config.bypass = value;
    outerContainer.classList.toggle("bypass", config.bypass);
    emitter.emit("change", { config });
  });

  // base
  // No base props - not relevant for smoother modifier

  // specific
  container.appendChild(strengthControl.element);

  return {
    element: outerContainer,
    events: emitter,
    update: (newConfig: AnyModifierConfig) => {
      if (newConfig.type !== "smoother") {
        throw new Error(`Invalid modifier config: ${JSON.stringify(newConfig)}`);
      }
      config = { ...newConfig };
      header.setBypass(config.bypass);
      strengthControl.update?.(config.strength);
    },
  };
}
