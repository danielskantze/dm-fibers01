import type {
  ParameterUniform,
  UniformType,
  UniformValue,
} from "../../types/gl/uniforms";
import { Emitter } from "../../util/events";
import type { Parameter, ParameterData } from "../parameters";
import type { ParameterModifier } from "./modifiers";
import type { AnyModifierConfig } from "./modifiers/types";
import type { ModifierMutations, ParameterEvents } from "./types";

export interface ManagedParameter extends Parameter {
  data: ParameterData;
  baseValue: UniformValue;
  modifiers: ParameterModifier<UniformType>[];
  value: UniformValue;
  updatedFrame: number;
}

//export interface ManagedParameterImplProps extends

export class ManagedParameterImpl implements ManagedParameter {
  data: ParameterUniform;
  baseValue: UniformValue;
  modifiers: ParameterModifier<UniformType>[];
  value: UniformValue;
  updatedFrame: number;
  events: Emitter<ParameterEvents>;

  constructor(props: Omit<ManagedParameter, keyof ModifierMutations | "events">) {
    this.data = props.data;
    this.baseValue = props.baseValue;
    this.modifiers = props.modifiers;
    this.value = props.value;
    this.updatedFrame = props.updatedFrame;
    this.events = new Emitter<ParameterEvents>();
    this.events.emit("modifierInit", {
      modifiers: this.modifiers.map(({ id, config }) => ({
        id,
        config,
      })),
    });
  }
  addModifier(modifier: ParameterModifier<UniformType>) {
    if (this.modifiers.find(m => m.id === modifier.id)) {
      return;
    }
    this.modifiers.push(modifier);
    const { id, config } = modifier;
    this.events.emit("modifierUpdate", {
      id,
      type: "add",
      config,
    });
  }
  updateModifier(id: string, config: AnyModifierConfig) {
    const modifier = this.modifiers.find(
      m => m.id === id
    ) as ParameterModifier<UniformType>;

    if (modifier.config.type !== config.type) {
      throw new Error(
        `Type mismatch: Cannot apply a config of type '${config.type}' to a modifier of type '${modifier.config.type}'.`
      );
    }

    modifier.config = config;
    this.events.emit("modifierUpdate", { id, type: "change", config });
  }
  removeModifier(id: string) {
    const index = this.modifiers.findIndex(m => m.id === id);
    if (index < 0) {
      return;
    }
    const { config } = this.modifiers.splice(index, 1)?.[0]!;
    const type = "delete";
    this.events.emit("modifierUpdate", { id, type, config });
  }
  clearModifiers() {
    this.modifiers = [];
    console.log("clearModifiers");
    this.events.emit("modifierClear", {});
  }
  reorderModifier(id: string, direction: "up" | "down") {
    const idx = this.modifiers.findIndex(m => m.id === id);
    if (idx < 0) {
      return;
    }
    if (direction === "up") {
      if (idx === 0) {
        return;
      }
      const previous = this.modifiers[idx - 1];
      const item = this.modifiers[idx];
      this.modifiers[idx - 1] = item;
      this.modifiers[idx] = previous;
    } else if (direction === "down") {
      if (idx > this.modifiers.length - 2) {
        return;
      }
      const next = this.modifiers[idx + 1];
      const item = this.modifiers[idx];
      this.modifiers[idx + 1] = item;
      this.modifiers[idx] = next;
    }
    this.events.emit("modifierInit", {
      modifiers: this.modifiers.map(({ id, config }) => ({
        id,
        config,
      })),
    });
  }
  initModifiers(modifiers: ParameterModifier<UniformType>[]) {
    let keys = new Set<string>();
    let dedup: ParameterModifier<UniformType>[] = [];
    modifiers.forEach(m => {
      if (!keys.has(m.id)) {
        dedup.push(m);
        keys.add(m.id);
      }
    });
    this.modifiers = dedup;
    this.events.emit("modifierInit", {
      modifiers: this.modifiers.map(({ id, config }) => ({
        id,
        config,
      })),
    });
  }
}
