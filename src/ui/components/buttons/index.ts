import type { Component } from "../types";
import "./buttons.css";

interface ButtonsComponent extends Component {
  updateButton: (id: string, title: string, svgIcon?: string) => void;
  setDisabled: (id: string, isDisabled: boolean) => void;
}

export function createButtons(
  buttons: {
    id: string;
    title: string;
    svgIcon?: string;
    onClick: () => void;
    color?: number;
  }[]
): ButtonsComponent {
  const container = document.createElement("div");
  const buttonWidth = (100 / buttons.length).toPrecision(4);
  container.classList.add("buttons");
  const buttonElements: { id: string; button: HTMLButtonElement }[] = [];
  for (const { id, title, svgIcon, onClick, color } of buttons) {
    const buttonWrapper = document.createElement("div");
    const button = document.createElement("button") as HTMLButtonElement;
    buttonWrapper.className = "button-wrapper";
    buttonWrapper.appendChild(button);
    buttonWrapper.style.width = `${buttonWidth}%`;
    if (color !== undefined) {
      button.classList.add(`color-${color}`);
    }
    if (svgIcon) {
      button.innerHTML = svgIcon;
      button.setAttribute("title", title);
    } else {
      button.innerText = title;
    }

    const clickHandler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (!button.disabled) {
        onClick();
      }
    };
    button.addEventListener("click", clickHandler);
    buttonElements.push({ id, button });
    container.appendChild(buttonWrapper);
  }
  return {
    element: container,
    updateButton: (id, title, svgIcon) => {
      let button = buttonElements.find(b => b.id === id)!.button;
      if (svgIcon) {
        button.innerHTML = svgIcon;
        button.setAttribute("title", title);
      } else {
        button.innerText = title;
      }
    },
    setDisabled: (id, isDisabled) => {
      buttonElements.find(b => b.id === id)!.button.disabled = isDisabled;
    },
    destroy: () => {},
  };
}
