import type {
  BaseModifierConfig,
  ModifierType,
} from "../../../service/parameters/modifiers";
import type { EventMap } from "../../../util/events";
import { createButtons } from "../buttons";
import type { AccessoryOwnerComponent, Component } from "../types";
import { createAudioModifier, type AudioModifierProps } from "./audio";
import { createLFOModifier, type LFOModifierProps } from "./lfo";

export interface ModifierProps {
  type: ModifierType;
}

type ModifierPropsMap = {
  lfo: LFOModifierProps;
  audio: AudioModifierProps;
};

export type AnyModifierProps = LFOModifierProps | AudioModifierProps;
export interface BaseConfigModifierProps extends ModifierProps {
  config: BaseModifierConfig;
}

export type Props = {
  modifiers: { id: string; props: AnyModifierProps }[];
  onAdd: (type: ModifierType) => void;
  onUpdate: (id: string, props: AnyModifierProps) => void;
  onRemove: (id: string) => void;
};

export interface ModifierComponentEventMap extends EventMap {
  change: {
    config: BaseModifierConfig;
  };
}

export interface ModifierComponent extends Component<ModifierComponentEventMap> {}

type CreateModifierFn<T> = (props: T) => ModifierComponent;

export interface ModifiersComponent extends AccessoryOwnerComponent {
  addModifier: (id: string, props: AnyModifierProps) => void;
  removeModifier: (id: string) => void;
  updateModifier: (id: string, props: AnyModifierProps) => void;
}

const modifierFactory: { [K in ModifierType]: CreateModifierFn<ModifierPropsMap[K]> } = {
  lfo: createLFOModifier,
  audio: createAudioModifier,
};

export function createModifiers(props: Props): ModifiersComponent {
  const container = document.createElement("div");
  const modifiers: { id: string; component: ModifierComponent; unsubscribe: any }[] = [];
  const modifiersList = document.createElement("div");
  const addItem = document.createElement("div");
  const buttons = createButtons([
    {
      id: "lfo",
      title: "+ LFO",
      onClick: function (): void {
        props.onAdd("lfo");
      },
    },
    {
      id: "audio",
      title: "+ Audio",
      onClick: () => {
        props.onAdd("audio");
      },
    },
  ]);

  function onModifierChange(id: string, type: ModifierType, config: BaseModifierConfig) {
    props.onUpdate(id, { type, config } as AnyModifierProps);
  }

  function addModifier(id: string, props: AnyModifierProps) {
    const createFn = modifierFactory[props.type];
    const component = createFn(props as any);
    component.element.dataset.modifierID = id;
    modifiersList.appendChild(component.element);
    const unsubscribe = component.events!.subscribe(
      "change",
      ({ config }: { config: BaseModifierConfig }) => {
        onModifierChange(id, props.type, config);
      }
    );
    modifiers.push({ id, component, unsubscribe });
  }

  function updateModifier(id: string, props: AnyModifierProps) {
    const component = modifiers.find(c => c.id === id)?.component;
    if (component) {
      console.log("update component here", props);
    }
  }

  function removeModifier(id: string) {
    const childNode = modifiersList.querySelector(`*[data-modifierId="${id}"]`);
    if (childNode) {
      modifiersList.removeChild(childNode as Node);
    }
  }

  props.modifiers.forEach(({ id, props }) => {
    const createFn = modifierFactory[props.type];
    const component = createFn(props as any);
    const unsubscribe = component.events!.subscribe(
      "change",
      ({ config }: { config: BaseModifierConfig }) =>
        onModifierChange(id, props.type, config)
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
