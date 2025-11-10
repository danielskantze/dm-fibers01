import type { UniformType } from "../../types/gl/uniforms";
import type { EventMap } from "../../util/events";
import type { ParameterModifier } from "./modifiers";
import type { AnyModifierConfig } from "./modifiers/types";

export class ModifierException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ModifierTypeException extends ModifierException {
  constructor(message: string) {
    super(message);
  }
}

export class ModifierRangeException extends ModifierException {
  constructor(message: string) {
    super(message);
  }
}

export interface ModifierMutations {
  addModifier: (modifier: ParameterModifier<UniformType>) => void;
  updateModifier: (id: string, config: AnyModifierConfig) => void;
  removeModifier: (id: string) => void;
  reorderModifier: (id: string, direction: "up" | "down") => void;
  clearModifiers: () => void;
  initModifiers: (modifiers: ParameterModifier<UniformType>[]) => void;
}

export type ModifierEventUpdateType = "add" | "change" | "delete";
export interface ParameterEvents extends EventMap {
  modifierInit: {
    modifiers: { id: string; config: AnyModifierConfig }[];
  };
  modifierUpdate: {
    id: string;
    type: "add" | "change" | "delete";
    config: AnyModifierConfig;
  };
  modifierClear: {};
}
