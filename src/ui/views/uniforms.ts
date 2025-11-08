import type {
  ParameterData,
  ParameterGroupKey,
  ParameterRegistry,
} from "../../service/parameters";
import type { PublicAudioStatsCollector } from "../../service/audio/audio-stats";
import {
  UniformComponents,
  isParameterUniform,
  type ParameterUniform,
} from "../../types/gl/uniforms";
import type { Emitter, Handler } from "../../util/events";
import { manageModifiersFor } from "../components/modifiers/manager";
import {
  isAccessoryOwnerComponent,
  type ComponentEventMap,
  type ParameterComponent,
} from "../components/types";
import { getFactoryFor } from "../parameter-components";
import type { UIRootEvents } from "../root";

function uniformElementId(group: string, id: string): string {
  return `__param-u-${group}-${id}`;
}

function createAccessoryEventHandler(
  registry: ParameterRegistry,
  group: ParameterGroupKey,
  parameter: string,
  audioAnalyzer: PublicAudioStatsCollector
): Handler<ComponentEventMap, "accessory"> {
  let destroyManager: (() => void) | null = null;

  return (props: any) => {
    const { isOpen, sender } = props.open;

    if (destroyManager) {
      destroyManager();
      destroyManager = null;
    }

    if (isOpen) {
      const param = registry.getParameter(group, parameter);
      destroyManager = manageModifiersFor(sender, param, audioAnalyzer);
    }
  };
}

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIRootEvents>,
  audioAnalyzer: PublicAudioStatsCollector
): ParameterComponent[] {
  const children: ParameterComponent[] = [];
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

      if (isAccessoryOwnerComponent(child)) {
        child.events.subscribe(
        "accessory",
          createAccessoryEventHandler(registry, group, parameter, audioAnalyzer)
      );
      }

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
  return children;
}
