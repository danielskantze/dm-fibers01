import type { Vec3 } from "../../../math/types";
import { mapCartesianToGimbal, mapGimbalToCartesian } from "../../../math/gimbal";
import template from './vec3.html?raw';
import './vec3.css';
import { createShaderCanvas } from "../../3d/shader-canvas";

export function createVec3(name: string, value: Vec3, onChange: (value: Vec3) => void): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;
    const control = wrapper.firstElementChild as HTMLDivElement;

    control.dataset.expanded = "0";
    const label = control.querySelector('header .label')! as HTMLDivElement;
    const expandRadio = control.querySelector('header .expand-radio')! as HTMLInputElement;
    const panelSelectors = control.querySelectorAll('header .panel-selector *[data-type]');
    const panels = control.querySelector('.panels') as HTMLDivElement;
    const canvasContainer = control.querySelector('.gimbal') as HTMLDivElement;

    const componentRangeInputs = control.querySelectorAll('.list-control input[type="range"]');
    const componentNumberInputs = control.querySelectorAll('.list-control input[type="number"]');

    function getVec3InternalSize(): [number, number] {
      const style = window.getComputedStyle(document.body)!;
      return [
        parseInt(style.getPropertyValue('--vec3-component-internal-width')),
        parseInt(style.getPropertyValue('--vec3-component-internal-height'))
      ];
    }
    const [internalWidth, internalHeight] = getVec3InternalSize();
    label.innerHTML = name;

    expandRadio.onclick = (e: Event) => {
      if (e.currentTarget === e.target) {
        const newValue = control.dataset.expanded === "1" ? "0" : "1";
        control.dataset.expanded = newValue;
        expandRadio.checked = newValue === "1";
      }
    };
    panelSelectors.forEach((s: Element) => {
      const elmt = s as HTMLDivElement;
      elmt.onclick = (e: Event) => {
        const type = (e.currentTarget as HTMLDivElement).dataset.type;
        if (type) {
            control.dataset.panel = type;
            panels.dataset.selected = type;
        }
      };
    });

    
    // 3D

    const inputH = control.querySelector(".controls > input.horizontal") as HTMLInputElement;
    const inputV = control.querySelector(".controls > input.vertical") as HTMLInputElement;
    const inputS = control.querySelector(".controls > input.length") as HTMLInputElement;

    const { canvas, update: updateGimbal } = createShaderCanvas(internalWidth, internalHeight);
    const angleRange = Math.PI * 2;
    
    let vector: Vec3 = [...value];
    let gimbalState = mapCartesianToGimbal(vector);

    function onDragV(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      gimbalState[0] = value * angleRange;
      vector = mapGimbalToCartesian(...gimbalState);
      updateGimbal(...gimbalState);
      updateListComponent();
      onChange(vector);
    }
    function onDragH(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      gimbalState[1] = value * angleRange;
      vector = mapGimbalToCartesian(...gimbalState);
      updateGimbal(...gimbalState);
      updateListComponent();
      onChange(vector);
    }
    function onDragS(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      gimbalState[2] = value;
      vector = mapGimbalToCartesian(...gimbalState);
      updateGimbal(...gimbalState);
      updateListComponent();
      onChange(vector);
    }
    inputH.addEventListener("input", onDragH);
    inputV.addEventListener("input", onDragV);
    inputS.addEventListener("input", onDragS);
    updateGimbal(...gimbalState);

    canvasContainer!.appendChild(canvas);

    // LIST

    function updateListComponent() {
      componentRangeInputs.forEach((node: Node, c: number) => {
        const inputElmt = node as HTMLInputElement;
        const uiValue = Math.round(vector[c] * 100000) / 100000;
        inputElmt.value = `${uiValue}`;
        (componentNumberInputs[c] as HTMLInputElement).value = `${uiValue}`;
      });
    }

    function onChangeComponent(e: Event) {
      const inputElmt = e.target as HTMLInputElement;
      const c = parseInt(inputElmt.dataset.component ?? "0");
      vector[c] = parseFloat(inputElmt.value);
      gimbalState = mapCartesianToGimbal(vector);
      updateGimbal(...gimbalState);
      updateListComponent();
      onChange(vector);
    }

    componentRangeInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('input', onChangeComponent);
    });

    return control;
}
