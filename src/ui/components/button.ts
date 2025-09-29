import './button.css';

export function createButton(title: string, onClick: () => void): HTMLDivElement {
    const container = document.createElement("div");
    const button = document.createElement("button");
    container.classList.add("button");
    button.innerText = title;
    button.onclick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    container.appendChild(button);
    return container;
}
