import type { PublicAudioStatsCollector } from "../service/audio/audio-stats";
import type { ParameterPreset, ParameterRegistry } from "../service/parameters";
import type { BlobItemData, BlobStore } from "../service/storage";
import type { ApplicationEvents } from "../types/application-events";
import { Emitter, type Subscribable } from "../util/events";
import { createAudioVisualizer } from "./components/audio";
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
  analyzer: PublicAudioStatsCollector;
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
  analyzer,
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
  const audioVisualizer = createAudioVisualizer(analyzer, 320, 75, 32);
  let isEditing = false;
  let hasStarted = false;
  const children: Component[] = [presetControls, audioControl, statusBar, modal];

  // PANEL

  element.appendChild(presetControls.element);
  element.appendChild(audioControl.element);

  const uniformControls = createUniformControls(
    element,
    params.list().map(([, , u]) => u),
    params,
    emitter,
    analyzer
  );
  children.push(...uniformControls);

  element.append(statusBar.element);

  // OTHER

  element.appendChild(audioVisualizer.element);

  // ---------------------------------------
  // HANDLERS
  // ---------------------------------------

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

  function onUserStart() {
    hasStarted = true;
    modal.hide();
    emitter.emit("play", {});
    modal.events.unsubscribe("click", onUserStart);
  }

  modal.events.subscribe("click", onUserStart);

  const onKeyDown = (e: KeyboardEvent) => {
    const menuKey = e.ctrlKey && e.key.charCodeAt(0) === ".".charCodeAt(0);
    const spaceKey = e.key.charCodeAt(0) === " ".charCodeAt(0);
    if (!hasStarted && (menuKey || spaceKey)) {
      onUserStart();
      if (menuKey) {
        controlFactory.visible = true;
        audioVisualizer.enable();
      }
    } else {
      if (menuKey) {
        controlFactory.visible = !controlFactory.visible;
        if (controlFactory.visible) {
          audioVisualizer.enable();
        } else {
          audioVisualizer.disable();
        }
      } else if (spaceKey) {
        if (!isEditing) {
          emitter.emit("play", {});
        }
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
