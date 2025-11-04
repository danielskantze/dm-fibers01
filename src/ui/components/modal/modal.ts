import { Emitter, type Subscribable } from "../../../util/events";
import type { Component, ComponentEventMap } from "../types";
import "./modal.css";
import template from "./modal.html?raw";

export interface ModalComponent extends Component<ModalEvents> {
  show: (text?: string) => void;
  hide: () => void;
  events: Subscribable<ModalEvents>;
}

export interface ModalEvents extends ComponentEventMap {
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
