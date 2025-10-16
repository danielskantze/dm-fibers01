import type { Matrix4x3 } from "../math/types";
import type { ParameterData, ParameterPreset, ParameterRegistry } from "../service/parameters";
import { UniformComponents } from "../types/gl/uniforms";
import { createButtons } from "./components/buttons";
import { createCosPalette } from "./components/cos-palette";
import { createDropdown } from "./components/dropdown";
import { createScalar } from "./components/scalar";
import type { UIComponent } from "./components/types";
import { createVector } from "./components/vector";
import { generateId } from "./util/id";

export function createUniformControls(controlsContainer: HTMLElement, uniforms: ParameterData[], registry: ParameterRegistry) {
    for (const u of uniforms) {
      const { ui } = u;
      if (ui) {
        const { name, min, max, step, component } = u.ui!;
        const numComponents = UniformComponents[u.type!]!;
        if (component === "cos-palette") {
          const { element, update } = createCosPalette(u.value as Matrix4x3, (v: Matrix4x3) => {
            u.value = v;
          });
          controlsContainer.appendChild(element);
          registry.subscribeParam(u, update);
        } else if (numComponents > 1) {
          const values = u.value as number[];
          const onChange = (i: number, v: number) => { values[i] = v; };
          const { element, update } = createVector(name, values, onChange, min, max, step);
          controlsContainer.appendChild(element);
          registry.subscribeParam(u, update);
        } else {
          const value = u.value as number;
          const type = u.ui?.type ?? (u.type == "int" ? "int" : "float");
          const enumValues = ui.options;
          const onChange = (v: number) => { u.value = v; };
          const { element, update } = createScalar({name, value, onChange, min, max, step, type, enumValues});
          controlsContainer.appendChild(element);
          registry.subscribeParam(u, update);
        }
      }
    }
  }

  function createPresetControls(load: () => ParameterPreset[], save: (items: ParameterPreset[]) => void, params: ParameterRegistry): UIComponent {
    return createDropdown<ParameterPreset>({
        id: "presets",
        items: load(),
        optionId: (o) => (o.id),
        optionTitle: (o) => (o.name),
        onSelect: (item) => {
          params.load(item);
        },
        onAdd: () => {
          const newItem = params.toPreset(generateId(), (new Date()).toLocaleString());
          return newItem;
        },
        onRemove: () => {
          if (load().length < 2) {
            return false;
          }
          return true;
        },
        onUpdate: (items) => {
          save(items);
        }
      });
  }

  export type UIProps = {
    element: HTMLElement,
    params: ParameterRegistry,
    loadPresets: () => ParameterPreset[],
    savePresets: (items: ParameterPreset[]) => void,
    onScreenshot: () => void,
    onPause: () => void,
    onToggleVisibility: () => void,
  }

  export function createUi({ element, params, loadPresets, savePresets, onScreenshot, onPause, onToggleVisibility }: UIProps) {
    const presetControls = createPresetControls(loadPresets, savePresets, params);
    element.appendChild(presetControls.element);
    createUniformControls(element, params.list().map(([,,u]) => (u)), params);
    element.appendChild(createButtons([
      {
        title: "Screenshot", 
        onClick: onScreenshot,
        color: 2
      },
      { 
        title: "Pause", 
        onClick: onPause, 
        color: 2 
      }
    ]));
  
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) { // 112 = p
        onToggleVisibility();
      }
    });
  }