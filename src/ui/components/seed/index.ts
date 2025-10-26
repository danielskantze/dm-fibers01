import { rndSeed } from "../../util/seed";
import type { Component } from "../types";
import "./seed.css";
import template from "./seed.html?raw";

type SeedProps = {
  title: string;
  value: string;
  buttonTitle: string;
  onSeed: (seed: string) => void;
};

export function createSeed(props: SeedProps): Component {
  const { title, buttonTitle, onSeed, value } = props;
  let currentValue = value;
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.innerHTML = template;
  const control = wrapper.firstElementChild as HTMLDivElement;
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
    element: wrapper,
    update: (v: any) => {
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
