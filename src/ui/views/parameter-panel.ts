import type { Matrix4x3 } from "../../math/types";
import type { ParameterData, ParameterPreset, ParameterRegistry } from "../../service/parameters";
import { UniformComponents } from "../../types/gl/uniforms";
import { createButtons } from "../components/buttons";
import { createCosPalette } from "../components/cos-palette";
import { createDropdown } from "../components/dropdown";
import { createScalar } from "../components/scalar";
import { createSeed } from "../components/seed";
import type { UIComponent } from "../components/types";
import { createVector } from "../components/vector";
import { Dispatcher } from "../../util/events";
import { generateId } from "../util/id";
import { rndSeed } from "../util/seed";

export type UIEvents = "screenshot" | "rec" | "pause" | "seed" | "reset";

export function createUniformControls(controlsContainer: HTMLElement, uniforms: ParameterData[], registry: ParameterRegistry, dispatcher: Dispatcher<UIEvents>) {
    for (const u of uniforms) {
      const { ui } = u;
      if (ui) {
        const { name, min, max, step, component, type } = u.ui!;
        const numComponents = UniformComponents[u.type!]!;
        if (type === "hidden") {
          continue;
        } else if (component === "cos-palette") {
          const { element, update } = createCosPalette(u.value as Matrix4x3, (v: Matrix4x3) => {
            u.value = v;
          });
          controlsContainer.appendChild(element);
          registry.subscribeParam(u, update);
        } else if (component === "seed") {
          const { element, update } = createSeed({
            title: "Seed",
            buttonTitle: "Update",
            onSeed: (seed: string) => {
              dispatcher.notify("seed", seed);
            },
            value: rndSeed()
          });
          controlsContainer.appendChild(element);
          registry.subscribeParam(u, update);
        } else if (numComponents > 1) {
          const values = u.value as number[];
          const onChange = (i: number, v: number) => { values[i] = v; };
          const { element, update } = createVector({name, values, onChange, min, max, step});
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

  function createPresetControls(select: (item: ParameterPreset) => void, load: () => ParameterPreset[], save: (items: ParameterPreset[]) => void, params: ParameterRegistry): UIComponent {
    return createDropdown<ParameterPreset>({
        id: "presets",
        items: load(),
        optionId: (o) => (o.id),
        optionTitle: (o) => (o.name),
        onSelect: select,
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
    selectPreset: (item: ParameterPreset) => void,
    loadPresets: () => ParameterPreset[],
    savePresets: (items: ParameterPreset[]) => void,
    onToggleVisibility: () => void,
  }

  export function createUi({ element, params, selectPreset, loadPresets, savePresets, onToggleVisibility }: UIProps): Dispatcher<UIEvents> {
    const presetControls = createPresetControls(selectPreset, loadPresets, savePresets, params);
    const dispatcher = new Dispatcher<UIEvents>();
    element.appendChild(presetControls.element);
    createUniformControls(element, params.list().map(([,,u]) => (u)), params, dispatcher);
    const buttons = createButtons([
      {
        id: "capture",
        title: "Capture", 
        onClick: () => (dispatcher.notify("screenshot")),
        color: 1
      },
      {
        id: "rec",
        title: "Rec", 
        onClick: () => {
          const isRecording = [undefined];
          dispatcher.notify("rec", isRecording);
          buttons.setTitle("rec", isRecording[0] ? "Stop" : "Rec");
        },
        color: 1
      },      
      {
        id: "reset",
        title: "Reset",
        onClick: () => (dispatcher.notify("reset")),
        color: 3,
      },
      { 
        id: "playpause",
        title: "Pause", 
        onClick: () => {
          const isPaused = [undefined];
          dispatcher.notify("pause", isPaused); // hack - we let the event modify the arg. The real solution would be to put the pause state in an observable property instead
          buttons.setTitle("playpause", isPaused[0] ? "Pause" : "Resume");
        },
        color: 2 
      }
    ]);
    element.appendChild(buttons.element);
  
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) { // 112 = p
        onToggleVisibility();
      }
    });
    return dispatcher;
  }