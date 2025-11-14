import type { ScalarValueType, UniformValue } from "../../../types/gl/uniforms";
import { Emitter } from "../../../util/events";
import { createModifierButton, type ToggleButtonComponent } from "../buttons/icon-button";
import type { ModifierOwnerComponent, ModifierOwnerEventMap } from "../types";
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
      return value.toPrecision(4);
  }
}

export type ScalarProps = {
  name: string;
  value: number;
  onChange: (value: number) => void;
  hasAccessory?: boolean;
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
  hasAccessory,
  min,
  max,
  step,
  type = "float",
  enumValues,
}: ScalarProps): ModifierOwnerComponent {
  const container: HTMLDivElement = document.createElement("div");
  const emitter = new Emitter<ModifierOwnerEventMap>();
  container.classList.add("scalar");
  container.classList.add("ui-control");

  const wrapper: HTMLDivElement = document.createElement("div");

  const label: HTMLLabelElement = document.createElement("label");
  const input: HTMLInputElement = document.createElement("input");
  const text: HTMLInputElement = document.createElement("input");

  let modifierButton: ToggleButtonComponent | undefined;
  const id: string = sanitizeName(name);
  const valueConfig: ValueConfig = { type, enumValues };

  text.setAttribute("type", "text");
  text.setAttribute("name", "d_" + id);
  input.setAttribute("name", "r_" + id);

  idSeq++;
  input.type = "range";

  if (min !== undefined || type === "enum") {
    input.min = type === "enum" ? "0" : min!.toString();
  }
  if (max !== undefined || type === "enum") {
    input.max = type === "enum" ? (enumValues!.length - 1).toString() : max!.toString();
  }
  if (step !== undefined || type === "enum") {
    input.step = type === "enum" ? "1" : step!.toString();
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

  const handleNumberChange = (textValue: string) => {
    let newValue = parseFloat(textValue);
    if (isNaN(newValue)) {
      return null;
    }
    if (min !== undefined) {
      newValue = Math.max(min, newValue);
    }
    if (max !== undefined) {
      newValue = Math.min(max, newValue);
    }
    if (type === "int") {
      newValue = Math.round(newValue);
    }
    return newValue;
  };

  const handleEnumChange = (textValue: any, enumValues: string[]) => {
    let newValue: number;
    const enumIndex = enumValues.findIndex(
      v => v.toLowerCase() === textValue.toLowerCase()
    );
    if (enumIndex !== -1) {
      newValue = enumIndex;
    } else {
      const parsed = parseFloat(textValue);
      if (isNaN(parsed)) {
        return null;
      }
      newValue = Math.max(0, Math.min(enumValues.length - 1, Math.round(parsed)));
    }
    return newValue;
  };

  // Add event listener for text input - make sure to update input (slider) too
  const onTextChange = (e: Event) => {
    const textValue = (e.target as HTMLInputElement).value;
    let newValue: number | null;

    // Handle enum type differently
    if (type === "enum" && enumValues) {
      newValue = handleEnumChange(textValue, enumValues);
    } else {
      newValue = handleNumberChange(textValue);
    }

    if (newValue === null) {
      text.value = getValue(parseFloat(input.value), valueConfig);
    } else {
      // Update slider and trigger onChange
      input.value = newValue.toString();
      onChange(newValue);
      text.value = getValue(newValue, valueConfig);
    }
  };

  const onTextBlur = () => {
    text.value = getValue(parseFloat(input.value), valueConfig);
  };

  text.addEventListener("change", onTextChange);
  text.addEventListener("blur", onTextBlur);

  label.textContent = name;
  label.setAttribute("for", inputId);

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  wrapper.appendChild(text);
  text.classList.add("digits");
  wrapper.classList.add("parameter");

  const component: ModifierOwnerComponent = {
    element: container,
    update: (value: UniformValue) => {
      if (typeof value === "number") {
        input.value = value.toString();
        text.value = getValue(value as number, valueConfig);
      } else {
        console.warn("Scalar component received non-number value:", value);
      }
    },
    destroy: () => {
      modifierButton?.destroy?.();
      input.removeEventListener("input", onInputChange);
      text.removeEventListener("change", onTextChange);
      text.removeEventListener("blur", onTextBlur);
      emitter.destroy();
    },
    events: emitter,
  };

  if (hasAccessory) {
    modifierButton = createModifierButton(component, emitter);
    component.modifierButton = modifierButton;
    wrapper.appendChild(modifierButton.element);
  }

  container.appendChild(wrapper);

  return component;
}
