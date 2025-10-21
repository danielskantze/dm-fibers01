import './buttons.css';

export function createButtons(buttons: {id: string, title: string, onClick: () => void, color?: number}[]): { element: HTMLElement, setTitle:(id: string, title: string) => void} {
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
        onClick();
      };
      buttonElements.push({id, button});
      container.appendChild(buttonWrapper);
    }
    return { 
      element: container, 
      setTitle: (id, title) => {
        buttonElements.find((b) => (b.id === id))!.button.innerText = title;
    }};
}
