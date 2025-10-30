import template from "./modal.html?raw";
import "./modal.css";
import type { Component } from "../types";
import { Emitter, type EventMap, type Subscribable } from "../../../util/events";

export interface ModalComponent extends Component {
  show: (text?: string) => void;
  hide: () => void;
  events: Subscribable<ModalEvents>;
}

export interface ModalEvents extends EventMap {
  click: "click";
}

export function createModal(): ModalComponent {
  const emitter = new Emitter<ModalEvents>();
  const container = document.createElement("div");
  container.innerHTML = template;
  document.body.appendChild(container);
  const modal = container.querySelector(".modal")!;
  const message = container.querySelector(".message")!;

  container.addEventListener("click", () => {
    emitter.emit("click", "click");
  });

  return {
    element: container,
    update: (value: string) => {
      message.innerHTML = value;
    },
    show: (text?: string) => {
      modal.classList.add("show");
      if (text) {
        message.innerHTML = text;
      }
    },
    hide: () => {
      modal.classList.remove("show");
    },
    destroy: () => {
      container.remove();
    },
    events: emitter,
  };
}
