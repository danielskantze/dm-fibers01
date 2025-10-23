import type { UIComponent } from '../types';
import './buttons.css';

interface ButtonsComponent extends UIComponent {
  setTitle: (id: string, title: string) => void;
  setDisabled: (id: string, isDisabled: boolean) => void;
};

export function createButtons(buttons: {id: string, title: string, onClick: () => void, color?: number}[]): ButtonsComponent {
    const container = document.createElement("div");
    const buttonWidth = (100 / buttons.length).toPrecision(4);
    container.classList.add("buttons");
    const buttonElements: {id: string, button: HTMLButtonElement}[] = [];
    for (const {id, title, onClick, color} of buttons) {
      const buttonWrapper = document.createElement("div");
      const button = document.createElement("button") as HTMLButtonElement;
      buttonWrapper.className = 'button-wrapper';
      buttonWrapper.appendChild(button);
      buttonWrapper.style.width = `${buttonWidth}%`;
      if (color !== undefined) {
        button.classList.add(`color-${color}`);
      }
      button.innerText = title;
      button.onclick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (!button.disabled) {
          onClick();
        }
      };
      buttonElements.push({id, button});
      container.appendChild(buttonWrapper);
    }
    return { 
        element: container, 
        setTitle: (id, title) => {
          buttonElements.find((b) => (b.id === id))!.button.innerText = title;
        },
        update: () => { },
        setDisabled: (id, isDisabled) => {
          buttonElements.find((b) => (b.id === id))!.button.disabled = isDisabled;
        }
    };
}
