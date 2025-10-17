import './buttons.css';

export function createButtons(buttons: {title: string, onClick: () => void, color?: number}[]): { element: HTMLElement, setTitle:(i: number, title: string) => void} {
    const container = document.createElement("div");
    const buttonWidth = (100 / buttons.length).toPrecision(4);
    container.classList.add("buttons");
    const buttonElements: HTMLButtonElement[] = [];
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
      buttonElements.push(button);
      container.appendChild(buttonWrapper);
    }
    return { 
      element: container, 
      setTitle: (i, title) => {
        buttonElements[i].innerText = title;
    }};
}
