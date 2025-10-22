import type { Matrix4x3 } from "../../math/types";
import type { ParameterData, ParameterPreset, ParameterRegistry } from "../../service/parameters";
import type { ApplicationEvents, ApplicationRecordStatus } from "../../types/application-events";
import { UniformComponents } from "../../types/gl/uniforms";
import { Emitter, type Subscribable } from "../../util/events";
import { createButtons } from "../components/buttons";
import { createCosPalette } from "../components/cos-palette";
import { createDropdown } from "../components/dropdown";
import { createScalar } from "../components/scalar";
import { createSeed } from "../components/seed";
import type { UIComponent } from "../components/types";
import { createVector } from "../components/vector";
import { generateId } from "../util/id";
import { rndSeed } from "../util/seed";

export type UIEvents = {
  screenshot: {},
  rec: {},
  pause: {},
  seed: {
    seed: string
  },
  reset: {}
};


export function createUniformControls(controlsContainer: HTMLElement, uniforms: ParameterData[], registry: ParameterRegistry, eventSource: Emitter<UIEvents>) {
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
              eventSource.emit("seed", { seed });
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

  function createPresetControls(select: (item: ParameterPreset) => void, 
    load: () => ParameterPreset[], 
    save: (items: ParameterPreset[]) => void, 
    params: ParameterRegistry): UIComponent {
      const dropdown = createDropdown<ParameterPreset>("presets", load(), () => (
        params.toPreset(
          generateId(), 
          (new Date()).toLocaleString()
        )
      ));
      dropdown.events.subscribe("select", ({item}) => {
        if (item) {
          select(item);
        }
      });
      dropdown.events.subscribe("change", ({items}) => { save(items); });
      return dropdown;
  }

  export type UIProps = {
    element: HTMLElement,
    params: ParameterRegistry,
    appEvents: Subscribable<ApplicationEvents>,
    selectPreset: (item: ParameterPreset) => void,
    loadPresets: () => ParameterPreset[],
    savePresets: (items: ParameterPreset[]) => void,
    onToggleVisibility: () => void,
  }

  export function createUi({ appEvents, element, params, selectPreset, loadPresets, savePresets, onToggleVisibility }: UIProps): Subscribable<UIEvents> {
    const presetControls = createPresetControls(selectPreset, loadPresets, savePresets, params);
    const emitter = new Emitter<UIEvents>();
    element.appendChild(presetControls.element);
    createUniformControls(element, params.list().map(([,,u]) => (u)), params, emitter);
    const buttons = createButtons([
      {
        id: "capture",
        title: "Capture", 
        onClick: () => (emitter.emit("screenshot", "")),
        color: 1
      },
      {
        id: "rec",
        title: "Rec", 
        onClick: () => { emitter.emit("rec", ""); },
        color: 1
      },      
      {
        id: "reset",
        title: "Reset",
        onClick: () => (emitter.emit("reset", "")),
        color: 3,
      },
      { 
        id: "playpause",
        title: "Pause", 
        onClick: () => {
          emitter.emit("pause", "");
        },
        color: 2 
      }
    ]);
    element.appendChild(buttons.element);

    appEvents.subscribe("record", (status) => {
      const statusTitles: Record<ApplicationRecordStatus, string> = {
        "idle": "Rec",
        "recording": "Rec...",
        "waiting": "..."
      }
      const title = statusTitles[status];
      buttons.setTitle("rec", title);
      buttons.setDisabled("rec", status === "waiting");
    });
    appEvents.subscribe("transport", (status) => {
      buttons.setTitle("playpause", status === "playing" ? "Pause" : "Resume");
    });
  
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) { // 112 = p
        onToggleVisibility();
      }
    });
    return emitter;
  }