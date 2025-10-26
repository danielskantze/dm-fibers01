import template from "./modal.html?raw";
import "./modal.css";
import type { UIComponent, UIComponentValue } from "../types";

export interface ModalComponent extends UIComponent {
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
    update: (value: UIComponentValue) => {
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
