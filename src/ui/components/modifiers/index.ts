import type { ModifierType } from "../../../service/parameters/modifiers";
import type { AnyModifierConfig } from "../../../service/parameters/modifiers/types";
import type { EventMap, Subscribable } from "../../../util/events";
import { createButtons } from "../buttons";
import type { Component } from "../types";
import { createAudioModifier } from "./audio";
import { createLFOModifier } from "./lfo";
import "./modifier.css";

export type Props = {
  modifiers: { id: string; config: AnyModifierConfig }[];
  onAdd: (type: ModifierType) => void;
  onUpdate: (id: string, config: AnyModifierConfig) => void;
  onRemove: (id: string) => void;
};

export interface ModifierComponentEventMap extends EventMap {
  change: {
    config: AnyModifierConfig;
  };
}

export interface ModifierComponent extends Component<ModifierComponentEventMap> {
  update: (config: AnyModifierConfig) => void;
  events: Subscribable<ModifierComponentEventMap>;
}

export interface ModifiersComponent extends Component {
  addModifier: (id: string, config: AnyModifierConfig) => void;
  removeModifier: (id: string) => void;
  updateModifier: (id: string, config: AnyModifierConfig) => void;
}

export function createModifiers(props: Props): ModifiersComponent {
  const container = document.createElement("div");
  const modifiers: { id: string; component: ModifierComponent; unsubscribe: any }[] = [];
  const modifiersList = document.createElement("div");
  const addItem = document.createElement("div");
  const buttons = createButtons([
    {
      id: "clear",
      title: "! Clear",
      onClick: () => {
        modifiers.forEach(m => props.onRemove(m.id));
      },
    },
    {
      id: "lfo",
      title: "+ LFO",
      onClick: () => props.onAdd("lfo"),
    },
    {
      id: "audio",
      title: "+ Audio",
      onClick: () => props.onAdd("audio"),
    },
  ]);

  function createModifierComponent(config: AnyModifierConfig): ModifierComponent {
    switch (config.type) {
      case "lfo":
        return createLFOModifier(config);
      case "audio":
        return createAudioModifier(config);
    }
  }

  function addModifier(id: string, config: AnyModifierConfig) {
    const component = createModifierComponent(config);
    component.element.dataset.modifierId = id;
    modifiersList.appendChild(component.element);
    const unsubscribe = component.events!.subscribe("change", ({ config }) => {
      props.onUpdate(id, config);
    });
    modifiers.push({ id, component, unsubscribe });
  }

  function updateModifier(id: string, config: AnyModifierConfig) {
    const component = modifiers.find(c => c.id === id)?.component;
    if (component) {
      component.update?.(config);
    }
  }

  function removeModifier(id: string) {
    const childNode = modifiersList.querySelector(`*[data-modifier-id="${id}"]`);
    if (childNode) {
      modifiersList.removeChild(childNode as Node);
    }
  }

  props.modifiers.forEach(({ id, config }) => {
    const component = createModifierComponent(config);
    component.element.dataset.modifierId = id;
    const unsubscribe = component.events!.subscribe("change", ({ config }) =>
      props.onUpdate(id, config)
    );
    modifiersList.appendChild(component.element);
    modifiers.push({ id, component, unsubscribe });
  });
  addItem.appendChild(buttons.element);
  container.appendChild(modifiersList);
  container.appendChild(addItem);
  return {
    element: container,
    destroy: () => {
      modifiers.forEach(m => {
        m.unsubscribe();
        m.component.destroy?.();
      });
    },
    addModifier,
    updateModifier,
    removeModifier,
  };
}
