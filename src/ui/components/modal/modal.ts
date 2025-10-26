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
    update: (value: any) => {
      const strValue = value as string;
      message.innerHTML = strValue;
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
  };
}
