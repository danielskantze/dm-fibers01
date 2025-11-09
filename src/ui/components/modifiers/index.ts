import type { ModifierType } from "../../../service/parameters/modifiers";
import type { AnyModifierConfig } from "../../../service/parameters/modifiers/types";
import type { EventMap, Subscribable } from "../../../util/events";
import { createButtons } from "../buttons";
import type { Component } from "../types";
import { createAudioModifier } from "./audio";
import { createLFOModifier } from "./lfo";
import "./modifier.css";
import clearIcon from "../../icons/clear.svg?raw";
import audioStatsIcon from "../../icons/audiostats.svg?raw";
import lfoIcon from "../../icons/lfo.svg?raw";
import { createModifierHeader, type ModifierHeaderComponent } from "./header";

export type Props = {
  modifiers: { id: string; config: AnyModifierConfig }[];
  onAdd: (type: ModifierType) => void;
  onUpdate: (id: string, config: AnyModifierConfig) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
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
  reorderModifier: (id: string, direction: "up" | "down") => void;
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
      svgIcon: clearIcon,
      color: 5,
      onClick: () => {
        modifiers.forEach(m => props.onRemove(m.id));
      },
    },
    {
      id: "lfo",
      title: "+ LFO",
      svgIcon: lfoIcon,
      onClick: () => props.onAdd("lfo"),
    },
    {
      id: "audio",
      title: "+ Audio",
      svgIcon: audioStatsIcon,
      onClick: () => props.onAdd("audio"),
    },
  ]);

  function createModifierComponent(config: AnyModifierConfig): {
    header: ModifierHeaderComponent;
    component: ModifierComponent;
  } {
    function onRemove(id: string) {
      props.onRemove(id);
      return;
    }
    function onMoveUp(id: string) {
      props.onReorder(id, "up");
      return true;
    }
    function onMoveDown(id: string) {
      props.onReorder(id, "down");
      return true;
    }

    let header: ModifierHeaderComponent;
    let modifier: ModifierComponent;

    switch (config.type) {
      case "lfo":
        header = createModifierHeader({
          title: "LFO",
          icon: lfoIcon,
          onRemove,
          onMoveUp,
          onMoveDown,
        });
        modifier = createLFOModifier(config, header);
        break;
      case "audio":
        header = createModifierHeader({
          title: "Audio",
          icon: audioStatsIcon,
          iconShiftY: -2,
          onRemove,
          onMoveUp,
          onMoveDown,
        });
        modifier = createAudioModifier(config, header);
        break;
    }
    return {
      header,
      component: modifier,
    };
  }

  function addModifier(id: string, config: AnyModifierConfig) {
    const { header, component } = createModifierComponent(config);
    component.element.dataset.modifierId = id;
    header.initialize(id);
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

  function reorderModifier(id: string) {
    const childNode = modifiersList.querySelector(`*[data-modifier-id="${id}"]`);
    if (childNode) {
      modifiersList.removeChild(childNode as Node);
    }
  }

  props.modifiers.forEach(({ id, config }, i, a) => {
    const { header, component } = createModifierComponent(config);
    component.element.dataset.modifierId = id;
    header.initialize(id);
    const unsubscribe = component.events!.subscribe("change", ({ config }) =>
      props.onUpdate(id, config)
    );
    modifiersList.appendChild(component.element);
    modifiers.push({ id, component, unsubscribe });
    header.setCanMoveUp(i === 0);
    header.setCanMoveDown(i === a.length - 1);
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
      container.removeChild(addItem);
      container.removeChild(modifiersList);
    },
    addModifier,
    updateModifier,
    removeModifier,
    reorderModifier,
  };
}
