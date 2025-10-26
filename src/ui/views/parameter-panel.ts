import type { ParameterPreset, ParameterRegistry } from "../../service/parameters";
import type { BlobItemData, BlobItemMetadata, BlobStore } from "../../service/storage";
import type { ApplicationEvents } from "../../types/application-events";
import { Emitter, type Subscribable } from "../../util/events";
import type { DropdownUIComponent } from "../components/dropdown";
import type { Component } from "../components/types";
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

export interface UI extends Subscribable<UIEvents> {
  destroy: () => void;
}

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
}: UIProps): UI {
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
  let isEditing = false;
  const children: Component[] = [presetControls, audioControl, statusBar];

  element.appendChild(presetControls.element);
  element.appendChild(audioControl.element);

  const uniformControls = createUniformControls(
    element,
    params.list().map(([, , u]) => u),
    params,
    emitter
  );
  children.push(...uniformControls);

  element.append(statusBar.element);

  const onAudio = ({
    status,
    id,
  }: {
    status: "loading" | "loaded" | "clear";
    id?: string;
  }) => {
    if (status === "loading") {
      audioControl.setDisabled(true);
    } else if (status === "loaded") {
      audioControl.setDisabled(false);
      audioControl.select(id);
    } else if (status === "clear") {
      audioControl.select(undefined);
    }
  };
  appEvents.subscribe("audio", onAudio);

  const onStatusBarClick = (id: "play" | "stop" | "record" | "reset" | "screenshot") => {
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
  };
  statusBar.events.subscribe("click", onStatusBarClick);

  function onEdit(type: "begin" | "end") {
    isEditing = type === "begin";
  }

  audioControl.events.subscribe("edit", onEdit);
  presetControls.events.subscribe("edit", onEdit);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) {
      // 112 = p
      onToggleVisibility();
    } else if (e.key.charCodeAt(0) === " ".charCodeAt(0)) {
      if (!isEditing) {
        emitter.emit("play", {});
      }
    }
  };
  document.addEventListener("keydown", onKeyDown);

  presetControls.select(initialPresetId);
  return {
    subscribe: emitter.subscribe.bind(emitter),
    unsubscribe: emitter.unsubscribe.bind(emitter),
    destroy: () => {
      appEvents.unsubscribe("audio", onAudio);
      statusBar.events.unsubscribe("click", onStatusBarClick);
      audioControl.events.unsubscribe("edit", onEdit);
      presetControls.events.unsubscribe("edit", onEdit);
      document.removeEventListener("keydown", onKeyDown);
      for (const child of children) {
        child.destroy?.();
      }
    },
  };
}
