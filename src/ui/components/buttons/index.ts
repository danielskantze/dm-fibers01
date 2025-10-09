import './buttons.css';

export function createButtons(buttons: {title: string, onClick: () => void, color?: number}[]): HTMLDivElement {
    const container = document.createElement("div");
    const buttonWidth = (100 / buttons.length).toPrecision(4);
    container.classList.add("buttons");
    for (const {title, onClick, color} of buttons) {
      const buttonWrapper = document.createElement("div");
      const button = document.createElement("button");
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
        onClick();
      };
      container.appendChild(buttonWrapper);
    }
    return container;
}
