import type { Vec3 } from "../../../math/types";
import { mapCartesianToGimbal, mapGimbalToCartesian } from "../../../math/gimbal";
import template from './vec3.html?raw';
import './vec3.css';

export function createVec3(name: string, value: Vec3, onChange: (value: Vec3) => void): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;
    const control = wrapper.firstElementChild as HTMLDivElement;

    control.dataset.expanded = "0";
    const label = control.querySelector('header .label')! as HTMLDivElement;
    const expandRadio = control.querySelector('header .expand-radio')! as HTMLInputElement;
    const panelSelectors = control.querySelectorAll('header .panel-selector *[data-type]');
    const panels = control.querySelector('.panels') as HTMLDivElement;

    const componentRangeInputs = control.querySelectorAll('.list-control input[type="range"]');
    const componentNumberInputs = control.querySelectorAll('.list-control input[type="number"]');

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

    // Hook up 3D view

    const inputH = control.querySelector(".controls > input.horizontal") as HTMLInputElement;
    const inputV = control.querySelector(".controls > input.vertical") as HTMLInputElement;
    const inputS = control.querySelector(".controls > input.length") as HTMLInputElement;
    const arrowA = control.querySelector(".xz > span.a") as HTMLSpanElement;
    const arrowB = control.querySelector(".xy > span.b") as HTMLSpanElement;
    const gimbal = control.querySelector(".gimbal") as HTMLDivElement;

    let [length, rotX, rotZ] = mapCartesianToGimbal(value);
    
    let vector: Vec3 = value;

    function applyTransform() {
      vector = mapGimbalToCartesian(length, rotX, rotZ);
    }

    function updateRotation() {
      const transform = `rotateX(${rotX * 180 / Math.PI}deg) rotateZ(${rotZ * 180 / Math.PI}deg)`;
      gimbal.style.transform = transform;
    }

    function updateLength() {
      const cssScaleL = 1.2 * length;
      const cssScaleH = 0.75 * length;// + (1.0 - scale) * 0.125;
      const transformA = `translate3d(var(--half-width), var(--half-width), var(--half-width)) scaleY(${cssScaleH}) scaleX(${cssScaleL})`;
      const transformB = `translate3d(var(--half-width), var(--half-width), var(--half-width)) scaleY(${cssScaleH}) scaleX(${cssScaleL})`;
      arrowA.style.transform = transformA;
      arrowB.style.transform = transformB;
    }

    function updateGimbalInputs() {
      inputH.value = `${rotX / Math.PI}`;
      inputV.value = `${(rotZ + Math.PI) / (Math.PI * 2)}`;
    }

    function onGimbalComponentChange() {
      updateRotation();
      updateLength();
      applyTransform();
      updateListComponent();
      onChange(vector);
    }
    function onDragH(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      rotX = value * Math.PI;
      onGimbalComponentChange();
    }
    function onDragV(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      rotZ = value * Math.PI * 2 - Math.PI;
      onGimbalComponentChange();
    }
    function onDragS(e: Event) {
      const value = parseFloat((e.target! as HTMLInputElement).value);
      length = value;
      onGimbalComponentChange();
    }
    inputH.addEventListener("input", onDragH);
    inputV.addEventListener("input", onDragV);
    inputS.addEventListener("input", onDragS);
    updateGimbalInputs();
    onGimbalComponentChange();

    // Hook up 3D view


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
      [length, rotX, rotZ] = mapCartesianToGimbal(vector);
      updateGimbalInputs();
      updateListComponent();
      onGimbalComponentChange();
      onChange(vector);
    }

    componentRangeInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('input', onChangeComponent);
    });

    return control;
}
