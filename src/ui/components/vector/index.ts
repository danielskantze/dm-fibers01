import { createScalarInner } from "../scalar";
import './vector.css';

const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

export function createVector(name: string, values: number[], onChange: (i: number, value: number) => void, min?: number, max?: number, step?: number): HTMLElement {
    const container: HTMLDivElement = document.createElement("div");
    container.classList.add("vector");
    container.dataset.collapsed = "1";
    
    const label = document.createElement("div");
    label.classList.add("label");
    label.innerText = name;
    container.appendChild(label);

    container.onclick = (e: Event) => {
      if (e.currentTarget === e.target || label.contains(e.target as Node)) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1";
        container.dataset.collapsed = newValue;
      }
    };
    for (let i = 0; i < values.length; i++) {
      const wrapper = document.createElement("div");
      createScalarInner(wrapper, vecCompName(i), values[i], (v: number) => onChange(i, v), min, max, step);
      container.appendChild(wrapper);
    }
    return container;
}
