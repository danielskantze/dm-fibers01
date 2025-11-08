import { createScalar } from "../scalar";
import { isVecLike } from "../../../math/types";
import type { UniformValue } from "../../../types/gl/uniforms";
import type { ParameterComponent } from "../types";
import "./vector.css";
import template from "./vector.html?raw";

const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

type AccessoryButton = {
  title: string;
  onClick: () => void;
};

type VectorProps = {
  name: string;
  values: number[];
  onChange: (i: number, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accessoryButton?: AccessoryButton;
};

export function createVector({
  name,
  values,
  onChange,
  min,
  max,
  step,
  accessoryButton,
}: VectorProps): ParameterComponent {
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.innerHTML = template;
  const control = wrapper.firstElementChild as HTMLDivElement;

  if (accessoryButton) {
    const button = wrapper.querySelector(".accessory-button") as HTMLButtonElement;
    button.innerText = accessoryButton.title;
    button.addEventListener("click", accessoryButton.onClick);
  }

  control.dataset.expanded = "0";
  const label = control.querySelector("header .label")! as HTMLDivElement;
  const expandRadio = control.querySelector(
    "header .expand-checkbox"
  )! as HTMLInputElement;
  const components = control.querySelector(".components");

  label.innerText = name;

  const onExpandClick = (e: Event) => {
    if (e.currentTarget === e.target) {
      const newValue = control.dataset.expanded === "1" ? "0" : "1";
      control.dataset.expanded = newValue;
      expandRadio.checked = newValue === "1";
    }
  };
  expandRadio.addEventListener("click", onExpandClick);

  const children: ParameterComponent[] = [];

  for (let i = 0; i < values.length; i++) {
    const child = createScalar({
      name: vecCompName(i),
      value: values[i],
      onChange: (v: number) => onChange(i, v),
      min,
      max,
      step,
    });
    components?.appendChild(child.element);
    children.push(child);
  }
  return {
    element: wrapper,
    update: (values: UniformValue) => {
      if (!isVecLike(values)) {
        console.warn("Vector component received non-array value:", values);
        return;
      }
      children.forEach((c, i) => c.update!(values[i]));
    },
    destroy: () => {
      expandRadio.removeEventListener("click", onExpandClick);
      if (accessoryButton) {
        const button = wrapper.querySelector(".accessory-button") as HTMLButtonElement;
        button.removeEventListener("click", accessoryButton.onClick);
      }
      for (const child of children) {
        child.destroy!();
      }
    },
  };
}
