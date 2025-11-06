import type {
  ParameterData,
  ParameterGroupKey,
  ParameterRegistry,
} from "../../service/parameters";
import type { ModifierType } from "../../service/parameters/modifiers";
import { LFOModifier } from "../../service/parameters/modifiers/lfo-modifier";
import {
  UniformComponents,
  isParameterUniform,
  type ParameterUniform,
} from "../../types/gl/uniforms";
import type { Emitter, Handler } from "../../util/events";
import {
  attachAccessoryView,
  removeAccessoryView,
} from "../components/decorators/accessory-view";
import { createModifiers, type ModifiersComponent } from "../components/modifiers";
import type { AudioModifierProps } from "../components/modifiers/audio";
import type { LFOModifierProps } from "../components/modifiers/lfo";
import type { AccessoryOwnerComponent, ComponentEventMap } from "../components/types";
import { getFactoryFor } from "../parameter-components";
import type { UIRootEvents } from "../root";

function uniformElementId(group: string, id: string): string {
  return `__param-u-${group}-${id}`;
}

type AnyModifierProps = LFOModifierProps | AudioModifierProps;

function createAccessoryEventHandler(
  registry: ParameterRegistry,
  group: ParameterGroupKey,
  parameter: string
): Handler<ComponentEventMap, "accessory"> {
  let unsubscribe: (() => void)[] = [];
  let components: ModifiersComponent | null = null;
  return props => {
    const { isOpen, sender } = props.open;
    while (unsubscribe.length > 0) {
      unsubscribe.shift()!();
    }
    if (isOpen) {
      const param = registry.getParameter(group, parameter);
      unsubscribe.push(
        param.events.subscribe("modifierUpdate", ({ id, type, config }) => {
          const props = { type: config.type, config } as AnyModifierProps;
          switch (type) {
            case "add":
              components!.addModifier(id, props);
              break;
            case "change":
              components!.updateModifier(id, props);
              break;
            case "delete":
              components!.removeModifier(id);
              break;
          }
        })
      );
      unsubscribe.push(
        param.events.subscribe("modifierInit", event => {
          const modifiers = event.modifiers.map(m => {
            const props = {
              type: m.config.type,
              config: m.config,
            } as AnyModifierProps;
            return { id: m.id, props };
          });
          components = createModifiers({
            modifiers,
            onAdd: (type: ModifierType) => {
              switch (type) {
                case "lfo":
                  LFOModifier.addTo(param, {});
              }
            },
          });
          attachAccessoryView(sender, components);
        })
      );
    } else {
      removeAccessoryView(sender);
    }
  };
}

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIRootEvents>
): AccessoryOwnerComponent[] {
  const children: AccessoryOwnerComponent[] = [];
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
      if (!registryKeys) {
        console.warn(`Uniform ${name} not found in registry`);
        continue;
      }
      const [group, parameter] = registryKeys!;
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
      child.events?.subscribe(
        "accessory",
        createAccessoryEventHandler(registry, group, parameter)
      );
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
