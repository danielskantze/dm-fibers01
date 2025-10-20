import { rndSeed } from '../../util/seed';
import type { UIComponent } from '../types';
import './seed.css';
import template from "./seed.html?raw";

type SeedProps = {
  title: string,
  value: string,
  buttonTitle: string;
  onSeed: (seed: string) => void;
}

export function createSeed(props: SeedProps): UIComponent {
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

  rndButton.onclick = () => {
    const v = rndSeed(12, 4);
    inputElmt.value = v;
    currentValue = v;
    buttonElmt.disabled = true;
    onSeed(inputElmt.value);
  }

  inputElmt.oninput = () => {
    buttonElmt.disabled = inputElmt.value === currentValue;
  }
  buttonElmt.onclick = () => {
    currentValue = inputElmt.value;
    buttonElmt.disabled = true;
    onSeed(inputElmt.value);
  };

  return {
    element: wrapper,
    update: (v: any) => {
      inputElmt.value = v as string;
      currentValue = v as string;
      buttonElmt.disabled = true;
    },
  }
}