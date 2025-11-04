import type { ParameterData, ParameterRegistry } from "../../service/parameters";
import {
  UniformComponents,
  isParameterUniform,
  type ParameterUniform,
} from "../../types/gl/uniforms";
import type { Emitter, Handler } from "../../util/events";
import { getFactoryFor } from "../parameter-components";
import type { Component, ComponentEventMap } from "../components/types";
import type { UIRootEvents } from "../root";
import {
  attachAccessoryView,
  removeAccessoryView,
} from "../components/decorators/accessory-view";
import { createModifiers, type ModifierType } from "../components/modifiers";
import type { LFOModifierProps } from "../components/modifiers/lfo";
import type { AudioModifierProps } from "../components/modifiers/audio";

function uniformElementId(group: string, id: string): string {
  return `__param-u-${group}-${id}`;
}

const handleAccessoryEvent: Handler<ComponentEventMap, "accessory"> = props => {
  if (props.open) {
    const { isOpen, sender } = props.open;
    if (isOpen) {
      const modifiers = createModifiers({
        modifiers: [
          {
            type: "lfo",
          } as LFOModifierProps,
          {
            type: "audio",
          } as AudioModifierProps,
          {
            type: "lfo",
          } as LFOModifierProps,
        ],
        onAdd: function (type: ModifierType): void {
          console.log("add", type);
        },
      });
      attachAccessoryView(sender, modifiers);
    } else {
      removeAccessoryView(sender);
    }
  }
};

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIRootEvents>
): Component[] {
  const children: Component[] = [];
  for (const u of uniforms) {
    const { domain, ui } = u;
    if (isParameterUniform(u) && ui) {
      const { name, component } = ui;
      const { min, max, step } = u.domain!;

      const numComponents = UniformComponents[u.type!]!;
      const factory = getFactoryFor(
        component ?? (numComponents > 1 ? "vector" : "scalar")
      );
      const registryKeys = registry.lookup(u);
      const props = {
        registryKeys,
        hasAccessory: true,
        name,
        min,
        max,
        step,
        value: u.value,
        values: u.value,
        onChange: (valOrIndex: any, val?: number) => {
          const uniformId = registry.lookup(u);
          if (!uniformId) return;
          const [group, parameter] = uniformId;

          if (val !== undefined) {
            // Vector component: valOrIndex is index, val is value
            const index = valOrIndex;
            const value = val;
            const currentValue = registry.getBaseValue<number[]>(group, parameter);
            const newValue = [...currentValue];
            newValue[index] = value;
            registry.setValue(group, parameter, newValue);
          } else {
            // Scalar, vec3, cos-palette etc.: valOrIndex is the new value
            registry.setValue(group, parameter, valOrIndex);
          }
        },
        onSeed: (seed: string) => eventSource.emit("seed", { seed }),
        type: u.domain.type,
        enumValues: domain.options,
        buttonTitle: "Update",
        title: "Seed",
      };

      const child = factory(props);
      child.events?.subscribe("accessory", handleAccessoryEvent);
      if (child) {
        controlsContainer.appendChild(child.element);
        if (registryKeys) {
          const [group, parameter] = registryKeys;
          child.element.id = uniformElementId(group, parameter);
          registry.subscribe<ParameterUniform>(group, parameter, value => {
            if (value !== undefined && child.update) {
              child.update(value);
            }
          });
        }
        children.push(child);
      }
    }
  }
  return children;
}
