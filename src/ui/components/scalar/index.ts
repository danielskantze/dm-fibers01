import type { ScalarValueType } from "../../../types/gl/uniforms";
import { Emitter } from "../../../util/events";
import collapseIcon from "../../icons/collapse.svg?raw";
import expandIcon from "../../icons/expand.svg?raw";
import { createIconToggleButton } from "../buttons/icon-button";
import type { AccessoryOwnerComponent, ComponentEventMap } from "../types";
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
}: ScalarProps): AccessoryOwnerComponent {
  const container: HTMLDivElement = document.createElement("div");
  const emitter = new Emitter<ComponentEventMap>();
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

  const component = {
    element: container,
    update: (value: number) => {
      input.value = value.toString();
      text.value = getValue(value as number, valueConfig);
    },
    destroy: () => {
      input.removeEventListener("input", onInputChange);
      emitter.destroy();
    },
    events: emitter,
  };

  if (hasAccessory) {
    let isAccessoryCollapsed = true;
    const accessoryButton = createIconToggleButton({
      svgIcons: [expandIcon, collapseIcon],
      size: "small",
      circular: true,
      onClick: function (): void {
        isAccessoryCollapsed = !isAccessoryCollapsed;
        accessoryButton.update!(isAccessoryCollapsed);
        emitter.emit("accessory", {
          open: {
            sender: component,
            isOpen: !isAccessoryCollapsed,
          },
        });
      },
    });
    wrapper.appendChild(accessoryButton.element);
  }

  container.appendChild(wrapper);

  return component;
}
