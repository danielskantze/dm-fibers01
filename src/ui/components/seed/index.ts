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
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.innerHTML = template;
  const control = wrapper.firstElementChild as HTMLDivElement;
  const titleElmt = control.querySelector("label") as HTMLLabelElement;
  const inputElmt = control.querySelector("input") as HTMLInputElement;
  const buttonElmt = control.querySelector("button") as HTMLButtonElement;
  titleElmt.innerText = title;
  buttonElmt.innerText = buttonTitle;
  buttonElmt.disabled = false;
  inputElmt.value = value;
  buttonElmt.onclick = () => {
    onSeed(inputElmt.value);
  };

  return {
    element: wrapper,
    update: (v: any) => {
      inputElmt.value = v as string;
    },
  }
}