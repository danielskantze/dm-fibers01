import type { ScalarValueType } from "../../../types/gl/uniforms";
import type { Component } from "../types";
import "./scalar.css";

let idSeq = 1;

function sanitizeName(name: string) {
  return name.toLowerCase().split(" ").join("-");
}

type ValueConfig = {
  type: ScalarValueType;
  enumValues?: string[];
};

function getValue(value: number, config: ValueConfig): string {
  const { type, enumValues } = config;
  switch (type) {
    case "int":
      return `${Math.round(value)}`;
    case "enum":
      return `${enumValues![Math.max(0, Math.min(enumValues!.length, Math.round(value)))]}`;
    default:
      return value.toFixed(2);
  }
}

export type ScalarProps = {
  name: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  type?: ScalarValueType;
  enumValues?: string[];
};

export function createScalar({
  name,
  value,
  onChange,
  min,
  max,
  step,
  type = "float",
  enumValues,
}: ScalarProps): Component {
  const container: HTMLDivElement = document.createElement("div");
  container.classList.add("scalar");
  container.classList.add("ui-control");

  const wrapper: HTMLDivElement = document.createElement("div");

  const label: HTMLLabelElement = document.createElement("label");
  const input: HTMLInputElement = document.createElement("input");
  const text: HTMLInputElement = document.createElement("input");
  const id: string = sanitizeName(name);
  const valueConfig: ValueConfig = { type, enumValues };

  text.setAttribute("disabled", "disabled");
  text.setAttribute("type", "text");
  text.setAttribute("name", "d_" + id);
  input.setAttribute("name", "r_" + id);

  idSeq++;
  input.type = "range";

  if (min !== undefined) {
    input.min = min.toString();
  }
  if (max !== undefined) {
    input.max = max.toString();
  }
  if (step !== undefined) {
    input.step = step!.toString();
  } else {
    input.step = "any";
  }
  if (value !== undefined) {
    input.value = value.toString();
    text.value = getValue(value, valueConfig);
  }

  const inputId = `control_${idSeq}`;
  input.id = inputId;

  const onInputChange = (e: Event) => {
    const newValue = parseFloat((e.target as HTMLInputElement).value);
    onChange(newValue);
    text.value = getValue(newValue, valueConfig);
  };
  input.addEventListener("input", onInputChange);

  label.textContent = name;
  label.setAttribute("for", inputId);

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  wrapper.appendChild(text);
  text.classList.add("digits");
  wrapper.classList.add("parameter");

  container.appendChild(wrapper);

  return {
    element: container,
    update: (value: number) => {
      input.value = value.toString();
      text.value = getValue(value as number, valueConfig);
    },
    destroy: () => {
      input.removeEventListener("input", onInputChange);
    },
  };
}
