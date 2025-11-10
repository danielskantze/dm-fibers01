import { rndSeed } from "../../util/seed";
import type { UniformValue } from "../../../types/gl/uniforms";
import type { ParameterComponent } from "../types";
import "./seed.css";
import template from "./seed.html?raw";

type SeedProps = {
  title: string;
  value: string;
  buttonTitle: string;
  onSeed: (seed: string) => void;
};

export function createSeed(props: SeedProps): ParameterComponent {
  const { title, buttonTitle, onSeed, value } = props;

  const tmp: HTMLDivElement = document.createElement("div");
  tmp.innerHTML = template;
  const control = tmp.firstElementChild as HTMLDivElement;

  let currentValue = value;
  const titleElmt = control.querySelector("label") as HTMLLabelElement;
  const rndButton = control.querySelector(".rnd-button") as HTMLDivElement;
  const inputElmt = control.querySelector("input") as HTMLInputElement;
  const buttonElmt = control.querySelector("button") as HTMLButtonElement;
  titleElmt.innerText = title;
  buttonElmt.innerText = buttonTitle;
  buttonElmt.disabled = true;
  inputElmt.value = value;

  const onRndClick = () => {
    const v = rndSeed(12, 4);
    inputElmt.value = v;
    currentValue = v;
    buttonElmt.disabled = true;
    onSeed(inputElmt.value);
  };
  rndButton.addEventListener("click", onRndClick);

  const onInputChange = () => {
    buttonElmt.disabled = inputElmt.value === currentValue;
  };
  inputElmt.addEventListener("input", onInputChange);

  const onButtonClick = () => {
    currentValue = inputElmt.value;
    buttonElmt.disabled = true;
    onSeed(inputElmt.value);
  };
  buttonElmt.addEventListener("click", onButtonClick);

  return {
    element: control,
    update: (v: UniformValue) => {
      if (typeof v !== "string") {
        console.warn("Seed component received non-string value:", v);
        return;
      }
      inputElmt.value = v as string;
      currentValue = v as string;
      buttonElmt.disabled = true;
    },
    destroy: () => {
      rndButton.removeEventListener("click", onRndClick);
      inputElmt.removeEventListener("input", onInputChange);
      buttonElmt.removeEventListener("click", onButtonClick);
    },
  };
}
