import type { ParameterPreset, ParameterRegistry } from "../service/parameters";
import type { BlobItemData, BlobStore } from "../service/storage";
import type { ApplicationEvents } from "../types/application-events";
import { Emitter, type Subscribable } from "../util/events";
import ControlFactory from "./components/controls";
import type { DropdownUIComponent } from "./components/dropdown";
import { createModal } from "./components/modal/modal";
import type { Component } from "./components/types";
import { createFileSelector } from "./views/file-selector";
import { createPresetControls } from "./views/presets";
import { createStatusBar } from "./views/statusbar";
import { createUniformControls } from "./views/uniforms";

export type UIRootEvents = {
  screenshot: {};
  rec: {};
  play: {};
  stop: {};
  reset: {};
  seed: {
    seed: string;
  };
  selectPreset: { preset: ParameterPreset };
  selectAudio: { item: BlobItemData | undefined };
};

export type UIRootProps = {
  element: HTMLElement;
  audioStore: BlobStore;
  params: ParameterRegistry;
  appEvents: Subscribable<ApplicationEvents>;
  initialPresetId: string;
  loadPresets: () => ParameterPreset[];
  savePresets: (items: ParameterPreset[]) => void;
};

export interface UIRoot extends Subscribable<UIRootEvents> {
  destroy: () => void;
}

export function createRoot({
  appEvents,
  element,
  audioStore,
  params,
  initialPresetId,
  loadPresets,
  savePresets,
}: UIRootProps): UIRoot {
  const controlFactory = new ControlFactory(element);
  const emitter = new Emitter<UIRootEvents>();
  const presetControls = createPresetControls(
    item => emitter.emit("selectPreset", { preset: item }),
    loadPresets,
    savePresets,
    params
  ) as DropdownUIComponent;
  const audioControl = createFileSelector(audioStore, "audio", "audio", item =>
    emitter.emit("selectAudio", { item })
  ) as DropdownUIComponent;
  const statusBar = createStatusBar(appEvents);
  const modal = createModal();
  let isEditing = false;
  const children: Component[] = [presetControls, audioControl, statusBar, modal];

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

  const onStatus = ({
    type,
    message,
  }: {
    type: "loading" | "ready";
    message: string;
  }) => {
    if (type === "loading") {
      modal.show(message);
    } else {
      modal.update?.(message);
    }
  };

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
  appEvents.subscribe("status", onStatus);

  const onStatusBarClick = (id: "play" | "stop" | "record" | "reset" | "screenshot") => {
    switch (id) {
      case "play":
        modal.hide();
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

  function onEdit({ type }: { type: "begin" | "end" }) {
    isEditing = type === "begin";
  }

  audioControl.events.subscribe("edit", onEdit);
  presetControls.events.subscribe("edit", onEdit);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0)) {
      controlFactory.visible = !controlFactory.visible;
    } else if (e.key.charCodeAt(0) === " ".charCodeAt(0)) {
      if (!isEditing) {
        modal.hide();
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
      appEvents.unsubscribe("status", onStatus);
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
