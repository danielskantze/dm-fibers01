import type {
  ApplicationEvents,
  ApplicationRecordStatus,
} from "../../types/application-events";
import { Emitter, type EventMap, type Subscribable } from "../../util/events";
import { createButtons } from "../components/buttons";
import type { UIComponent } from "../components/types";
import {
  clearIcon,
  pauseIcon,
  playIcon,
  recordIcon,
  screenshotIcon,
  stopIcon,
} from "../icons";

export interface StatusBarEvents extends EventMap {
  click: "screenshot" | "record" | "reset" | "play" | "stop";
}

interface StatusBarComponent extends UIComponent {
  events: Subscribable<StatusBarEvents>;
}

export function createStatusBar(
  appEvents: Subscribable<ApplicationEvents>
): StatusBarComponent {
  const emitter = new Emitter<StatusBarEvents>();
  const element = document.createElement("div");
  const buttons = createButtons([
    {
      id: "capture",
      title: "Capture",
      svgIcon: screenshotIcon,
      onClick: () => emitter.emit("click", "screenshot"),
      color: 0,
    },
    {
      id: "rec",
      title: "Rec",
      svgIcon: recordIcon,
      onClick: () => {
        emitter.emit("click", "record");
      },
      color: 0,
    },
    {
      id: "reset",
      title: "Reset",
      svgIcon: clearIcon,
      onClick: () => emitter.emit("click", "reset"),
      color: 0,
    },
    {
      id: "stop",
      title: "Stop",
      svgIcon: stopIcon,
      onClick: () => {
        emitter.emit("click", "stop");
      },
      color: 0,
    },
    {
      id: "playpause",
      title: "Pause",
      svgIcon: playIcon,
      onClick: () => {
        emitter.emit("click", "play");
      },
      color: 0,
    },
  ]);
  element.appendChild(buttons.element);

  appEvents.subscribe("record", status => {
    const statusTitles: Record<ApplicationRecordStatus, string> = {
      idle: "Rec",
      recording: "Rec...",
      waiting: "...",
    };
    const title = statusTitles[status];
    buttons.updateButton("rec", title);
    buttons.setDisabled("rec", status === "waiting");
  });
  appEvents.subscribe("transport", status => {
    let title: string;
    let svgIcon: string;
    switch (status) {
      case "playing":
        title = "Pause";
        svgIcon = pauseIcon;
        buttons.setDisabled("stop", false);
        break;
      case "stop":
        title = "Resume";
        svgIcon = playIcon;
        buttons.setDisabled("stop", true);
        break;
      case "paused":
        title = "Resume";
        svgIcon = playIcon;
        break;
    }
    buttons.updateButton("playpause", title, svgIcon);
  });
  appEvents.subscribe("audio", ({ status }) => {
    if (status === "loading") {
      buttons.setDisabled("playpause", true);
    } else if (status === "loaded") {
      buttons.setDisabled("playpause", false);
    }
  });
  return {
    element,
    update: () => {},
    events: emitter,
  };
}
