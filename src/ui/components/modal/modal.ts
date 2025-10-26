import template from "./modal.html?raw";
import "./modal.css";
import type { Component } from "../types";

export interface ModalComponent extends Component {
  show: (text?: string) => void;
  hide: () => void;
}

export function createModal(): ModalComponent {
  const container = document.createElement("div");
  container.innerHTML = template;
  document.body.appendChild(container);
  const modal = container.querySelector(".modal")!;
  const message = container.querySelector(".message")!;
  return {
    element: container,
    update: (value: string) => {
      message.innerHTML = value;
      console.log("update", value);
    },
    show: (text?: string) => {
      modal.classList.add("show");
      console.log("show", text);
      if (text) {
        message.innerHTML = text;
      }
    },
    hide: () => {
      console.log("hide");
      modal.classList.remove("show");
    },
    destroy: () => {
      container.remove();
    },
  };
}
