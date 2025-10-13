import type { ScalarUIType } from '../../../types/gl/uniforms';
import './scalar.css';

let idSeq = 1;

function sanitizeName(name: string) {
  return name.toLowerCase().split(" ").join("-");
}

type ValueConfig = {
  type: ScalarUIType,
  enumValues?: string[]
};

function getValue(value: number, config: ValueConfig): string {
  const { type, enumValues } = config;
  switch (type) {
    case "int":
      return `${Math.round(value)}`;
    case "enum":
      return `${enumValues![
        Math.max(0, 
          Math.min(enumValues!.length, Math.round(value))
        )
      ]}`;
    default:
      return value.toFixed(2);
  }
}

export function createScalarInner(wrapper: HTMLElement, name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number, type: ScalarUIType = "float", enumValues?: string[]) {
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

    input.oninput = (e) => {
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      onChange(newValue);
      text.value = getValue(newValue, valueConfig);
    };

    label.textContent = name;
    label.setAttribute("for", inputId);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(text);
    text.classList.add("digits");
    wrapper.classList.add("parameter");
}

export function createScalar(name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number, type: ScalarUIType = "float", enumValues?: string[]): HTMLElement {
    const container: HTMLDivElement = document.createElement("div");
    container.classList.add("scalar");

    const wrapper: HTMLDivElement = document.createElement("div");
    createScalarInner(wrapper, name, value, onChange, min, max, step, type, enumValues);
    container.appendChild(wrapper);

    return container;
}
