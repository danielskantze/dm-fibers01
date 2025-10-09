import { createScalar, createScalarInner } from "../scalar";
import './vector.css';
import template from './vector.html?raw';

const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

export function createVector(name: string, values: number[], onChange: (i: number, value: number) => void, min?: number, max?: number, step?: number): HTMLElement {
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.innerHTML = template;
  const control = wrapper.firstElementChild as HTMLDivElement;

  control.dataset.expanded = "0";
  const label = control.querySelector('header .label')! as HTMLDivElement;
  const expandRadio = control.querySelector('header .expand-radio')! as HTMLInputElement;
  const components = control.querySelector('.components');

  label.innerText = name;

  expandRadio.onclick = (e: Event) => {
    if (e.currentTarget === e.target) {
      const newValue = control.dataset.expanded === "1" ? "0" : "1";
      control.dataset.expanded = newValue;
      expandRadio.checked = newValue === "1";
    }
  };

  for (let i = 0; i < values.length; i++) {
    //const wrapper = document.createElement("div");
    //createScalarInner(wrapper, vecCompName(i), values[i], (v: number) => onChange(i, v), min, max, step);
    //container.appendChild(wrapper);
    const scalar = createScalar(
      vecCompName(i), 
      values[i],
      (v: number) => { onChange(i, v); },
      min,
      max,
      step
    );
    components?.appendChild(scalar);
  }
  return wrapper;
}
