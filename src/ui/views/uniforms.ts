import type { Matrix4x3 } from "../../math/types";
import type { ParameterData, ParameterRegistry } from "../../service/parameters";
import { UniformComponents } from "../../types/gl/uniforms";
import type { Emitter } from "../../util/events";
import { createCosPalette } from "../components/cos-palette";
import { createScalar } from "../components/scalar";
import { createSeed } from "../components/seed";
import { createVector } from "../components/vector";
import { rndSeed } from "../util/seed";
import type { UIEvents } from "./parameter-panel";

export function createUniformControls(
  controlsContainer: HTMLElement,
  uniforms: ParameterData[],
  registry: ParameterRegistry,
  eventSource: Emitter<UIEvents>
) {
  for (const u of uniforms) {
    const { ui } = u;
    if (ui) {
      const { name, min, max, step, component, type } = u.ui!;
      const numComponents = UniformComponents[u.type!]!;
      if (type === "hidden") {
        continue;
      } else if (component === "cos-palette") {
        const { element, update } = createCosPalette(
          u.value as Matrix4x3,
          (v: Matrix4x3) => {
            u.value = v;
          }
        );
        controlsContainer.appendChild(element);
        registry.subscribeParam(u, update);
      } else if (component === "seed") {
        const { element, update } = createSeed({
          title: "Seed",
          buttonTitle: "Update",
          onSeed: (seed: string) => {
            eventSource.emit("seed", { seed });
          },
          value: rndSeed(),
        });
        controlsContainer.appendChild(element);
        registry.subscribeParam(u, update);
      } else if (numComponents > 1) {
        const values = u.value as number[];
        const onChange = (i: number, v: number) => {
          values[i] = v;
        };
        const { element, update } = createVector({
          name,
          values,
          onChange,
          min,
          max,
          step,
        });
        controlsContainer.appendChild(element);
        registry.subscribeParam(u, update);
      } else {
        const value = u.value as number;
        const type = u.ui?.type ?? (u.type == "int" ? "int" : "float");
        const enumValues = ui.options;
        const onChange = (v: number) => {
          u.value = v;
        };
        const { element, update } = createScalar({
          name,
          value,
          onChange,
          min,
          max,
          step,
          type,
          enumValues,
        });
        controlsContainer.appendChild(element);
        registry.subscribeParam(u, update);
      }
    }
  }
}
