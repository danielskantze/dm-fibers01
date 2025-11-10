import { createScalar } from "../scalar";
import { isVecLike } from "../../../math/types";
import type { UniformValue } from "../../../types/gl/uniforms";
import type {
  AccessoryOwnerComponent,
  AccessoryOwnerEventMap,
  ParameterComponent,
} from "../types";
import "./vector.css";
import template from "./vector.html?raw";
import { Emitter } from "../../../util/events";
import {
  createAccessoryButton,
  type ToggleButtonComponent,
} from "../buttons/icon-button";

const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

type VectorProps = {
  name: string;
  values: number[];
  onChange: (i: number, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hasAccessory?: boolean;
};

export function createVector({
  name,
  values,
  onChange,
  min,
  max,
  step,
  hasAccessory,
}: VectorProps): AccessoryOwnerComponent {
  const tmp: HTMLDivElement = document.createElement("div");
  tmp.innerHTML = template;
  const control = tmp.firstElementChild as HTMLDivElement;

  const emitter = new Emitter<AccessoryOwnerEventMap>();
  let accessoryButton: ToggleButtonComponent | undefined;

  control.dataset.expanded = "0";
  const label = control.querySelector("header .label")! as HTMLDivElement;
  const header = control.querySelector("header") as HTMLDivElement;
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
  const component = {
    element: control,
    update: (values: UniformValue) => {
      if (!isVecLike(values)) {
        console.warn("Vector component received non-array value:", values);
        return;
      }
      children.forEach((c, i) => c.update!(values[i]));
    },
    destroy: () => {
      accessoryButton?.destroy?.();
      expandRadio.removeEventListener("click", onExpandClick);
      for (const child of children) {
        child.destroy!();
      }
      emitter.destroy();
    },
    events: emitter,
  };

  if (hasAccessory) {
    accessoryButton = createAccessoryButton(component, emitter);
    header.appendChild(accessoryButton.element);
  }

  return component;
}
