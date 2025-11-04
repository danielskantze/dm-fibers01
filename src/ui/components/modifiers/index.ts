import { createIconButton } from "../buttons/icon-button";
import type { Component } from "../types";
import addIcon from "../../icons/add.svg?raw";
import { createButtons } from "../buttons";
import type { LFOModifier } from "../../../service/parameters/modifiers/lfo-modifier";
import { createAudioModifier, type AudioModifierProps } from "./audio";
import { createLFOModifier, type LFOModifierProps } from "./lfo";

export type ModifierType = "lfo" | "audio";

export interface ModifierProps {
  type: ModifierType;
}

type ModifierPropsMap = {
  lfo: LFOModifierProps;
  audio: AudioModifierProps;
};

type AnyModifierProps = LFOModifierProps | AudioModifierProps;

export type Props = {
  modifiers: AnyModifierProps[];
  onAdd: (type: ModifierType) => void;
};

type CreateModifierFn<T> = (props: T) => Component;

const modifierFactory: { [K in ModifierType]: CreateModifierFn<ModifierPropsMap[K]> } = {
  lfo: createLFOModifier,
  audio: createAudioModifier,
};

export function createModifiers(props: Props): Component {
  const container = document.createElement("div");
  const modifiersList = document.createElement("div");
  const addItem = document.createElement("div");
  const buttons = createButtons([
    {
      id: "lfo",
      title: "+ LFO",
      onClick: function (): void {
        console.log("Add LFO");
      },
    },
    {
      id: "audio",
      title: "+ Audio",
      onClick: () => {
        console.log("Add audio stats monitor");
      },
    },
  ]);
  props.modifiers.forEach(m => {
    const createFn = modifierFactory[m.type];
    modifiersList.appendChild(createFn(m as any).element);
  });
  addItem.appendChild(buttons.element);
  container.appendChild(modifiersList);
  container.appendChild(addItem);
  return {
    element: container,
  };
}
