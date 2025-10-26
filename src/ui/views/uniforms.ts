import type { ParameterData, ParameterRegistry } from "../../service/parameters";
import { UniformComponents } from "../../types/gl/uniforms";
import type { Emitter } from "../../util/events";
import { getFactoryFor } from "../component-registry";
import type { Component } from "../components/types";
import type { UIRootEvents } from "../root";

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIRootEvents>
): Component[] {
  const children: Component[] = [];
  for (const u of uniforms) {
    const { ui } = u;
    if (ui) {
      const { name, min, max, step, component, type } = u.ui!;
      if (type === "hidden") {
        continue;
      }

      const numComponents = UniformComponents[u.type!]!;
      const factory = getFactoryFor(
        component ?? (numComponents > 1 ? "vector" : "scalar")
      );
      const props = {
        name,
        min,
        max,
        step,
        value: u.value,
        values: u.value,
        onChange: (v: any, i: number) => {
          if (i !== undefined) {
            (u.value as number[])[i] = v;
          } else {
            u.value = v;
          }
        },
        onSeed: (seed: string) => eventSource.emit("seed", { seed }),
        type: u.ui?.type ?? (u.type === "int" ? "int" : "float"),
        enumValues: ui.options,
        buttonTitle: "Update",
        title: "Seed",
      };

      const child = factory(props);
      if (child) {
        controlsContainer.appendChild(child.element);
        registry.subscribeParam(u, child.update!);
        children.push(child);
      }
    }
  }
  return children;
}
