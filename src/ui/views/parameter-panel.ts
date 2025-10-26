import type { ParameterPreset, ParameterRegistry } from "../../service/parameters";
import type { BlobItemData, BlobItemMetadata, BlobStore } from "../../service/storage";
import type { ApplicationEvents } from "../../types/application-events";
import { Emitter, type Subscribable } from "../../util/events";
import type { DropdownUIComponent } from "../components/dropdown";
import { createFileSelector } from "./file-selector";
import { createPresetControls } from "./presets";
import { createStatusBar } from "./statusbar";
import { createUniformControls } from "./uniforms";

export type UIEvents = {
  screenshot: {};
  rec: {};
  play: {};
  stop: {};
  reset: {};
  seed: {
    seed: string;
  };
};

export type UIProps = {
  element: HTMLElement;
  audioStore: BlobStore;
  params: ParameterRegistry;
  appEvents: Subscribable<ApplicationEvents>;
  initialPresetId: string;
  selectPreset: (item: ParameterPreset) => void;
  loadPresets: () => ParameterPreset[];
  savePresets: (items: ParameterPreset[]) => void;
  onToggleVisibility: () => void;
  onSelectAudio: (item: BlobItemData | undefined) => void;
};

export function createUi({
  appEvents,
  element,
  audioStore,
  params,
  initialPresetId,
  selectPreset,
  loadPresets,
  savePresets,
  onToggleVisibility,
  onSelectAudio,
}: UIProps): Subscribable<UIEvents> {
  const presetControls = createPresetControls(
    selectPreset,
    loadPresets,
    savePresets,
    params
  ) as DropdownUIComponent<ParameterPreset>;
  const audioControl = createFileSelector(
    audioStore,
    "audio",
    "audio",
    onSelectAudio
  ) as DropdownUIComponent<BlobItemMetadata>;
  const statusBar = createStatusBar(appEvents);
  const emitter = new Emitter<UIEvents>();
  element.appendChild(presetControls.element);
  element.appendChild(audioControl.element);

  createUniformControls(
    element,
    params.list().map(([, , u]) => u),
    params,
    emitter
  );

  element.append(statusBar.element);

  appEvents.subscribe("audio", ({ status, id }) => {
    if (status === "loading") {
      audioControl.setDisabled(true);
    } else if (status === "loaded") {
      audioControl.setDisabled(false);
      audioControl.select(id);
    } else if (status === "clear") {
      audioControl.select(undefined);
    }
  });

  statusBar.events.subscribe("click", id => {
    switch (id) {
      case "play":
        emitter.emit("play", {});
        break;
      case "stop":
        emitter.emit("stop", {});
        break;
      case "record":
        emitter.emit("rec", {});
        break;
      case "reset":
        emitter.emit("reset", {});
        break;
      case "screenshot":
        emitter.emit("screenshot", {});
        break;
    }
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) {
      // 112 = p
      onToggleVisibility();
    }
  });

  presetControls.select(initialPresetId);
  return emitter;
}
