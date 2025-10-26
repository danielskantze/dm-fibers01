import type { Matrix4x3 } from "../../math/types";
import type { ParameterData, ParameterRegistry } from "../../service/parameters";
import { UniformComponents } from "../../types/gl/uniforms";
import type { Emitter } from "../../util/events";
import { createCosPalette } from "../components/cos-palette";
import { createScalar } from "../components/scalar";
import { createSeed } from "../components/seed";
import type { Component } from "../components/types";
import { createVector } from "../components/vector";
import { rndSeed } from "../util/seed";
import type { UIRootEvents } from "../root";

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIRootEvents>
) {
  const children = [];
  for (const u of uniforms) {
    const { ui } = u;
    if (ui) {
      const { name, min, max, step, component, type } = u.ui!;
      const numComponents = UniformComponents[u.type!]!;
      let child: Component | undefined;
      if (type === "hidden") {
        continue;
      } else if (component === "cos-palette") {
        child = createCosPalette(u.value as Matrix4x3, (v: Matrix4x3) => {
          u.value = v;
        });
        registry.subscribeParam(u, child.update!);
      } else if (component === "seed") {
        child = createSeed({
          title: "Seed",
          buttonTitle: "Update",
          onSeed: (seed: string) => {
            eventSource.emit("seed", { seed });
          },
          value: rndSeed(),
        });
        registry.subscribeParam(u, child.update!);
      } else if (numComponents > 1) {
        const values = u.value as number[];
        const onChange = (i: number, v: number) => {
          values[i] = v;
        };
        child = createVector({
          name,
          values,
          onChange,
          min,
          max,
          step,
        });
        registry.subscribeParam(u, child.update!);
      } else {
        const value = u.value as number;
        const type = u.ui?.type ?? (u.type == "int" ? "int" : "float");
        const enumValues = ui.options;
        const onChange = (v: number) => {
          u.value = v;
        };
        child = createScalar({
          name,
          value,
          onChange,
          min,
          max,
          step,
          type,
          enumValues,
        });
        registry.subscribeParam(u, child.update!);
      }
      if (child) {
        controlsContainer.appendChild(child.element);
        children.push(child);
      }
    }
  }
  return children;
}
