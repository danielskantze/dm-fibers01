import type { Matrix4x4, Vec3 } from "../../../math/types";
import { mapCartesianToGimbal, mapGimbalToCartesian } from "../../../math/gimbal";
import template from './vec3.html?raw';
import './vec3.css';
import { createVec3GimbalView } from "../../3d/vec3-gimbal";
import * as mat4 from "../../../math/mat4";
import * as vec3 from "../../../math/vec3";
import * as vec4 from "../../../math/vec4";

const vec3Ref: Vec3 = [0, 1, 0];

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

    const { canvas, update: updateGimbal } = createVec3GimbalView(internalWidth, internalHeight);
    const angleRange = Math.PI * 2;
    
    let vector: Vec3 = [...value];
    let matrices = vectorToMatrices(vector);
    let inputState = [
      parseFloat(inputV.value), 
      parseFloat(inputH.value),
      parseFloat(inputS.value)
    ];

    function vectorToMatrices(v: Vec3): [Matrix4x4, Matrix4x4] {
      let m: Matrix4x4 = mat4.getVectorRotationMat(vec3Ref, v);
      let im: Matrix4x4 = mat4.getVectorRotationMat(v, vec3Ref);
      return [m, im];
    }

    function applyTransforms(angle?: number, rotateFn?: (a: number) => Matrix4x4) {
      let [m, im] = matrices;
      if (angle !== undefined && rotateFn !== undefined) {
        const rotM = rotateFn(angle);
        const iRotM = rotateFn(angle);
        m = mat4.multiplyMat(m, rotM);
        im = mat4.multiplyMat(iRotM, m);
      }
      matrices[0] = m;
      matrices[1] = im;
      updateGimbal(m, im, vec3.length(vector));
      //updateListComponent();
      //onChange(vector);
    }

    function onDragV(e: Event) {
      const elmt = (e.target! as HTMLInputElement);
      const value = parseFloat(elmt.value);
      const delta = value - inputState[0];
      console.log(delta);
      applyTransforms(delta * angleRange, mat4.rotateX);
      inputState[0] = value;
    }
    function onCommitV() {
      let [m] = matrices;
      vector = vec3.fromVec4(mat4.multiplyVec(vec4.fromVec3(vec3Ref), m));
      inputH.value = "0";
      inputV.value = "0";
      inputState[0] = 0;
      inputState[1] = 0;
      matrices = vectorToMatrices(vector);
    }

    function onDragH(e: Event) {
      const elmt = (e.target! as HTMLInputElement);
      const value = parseFloat(elmt.value);
      const delta = value - inputState[1];
      applyTransforms(delta * angleRange, mat4.rotateZ);
      inputState[1] = value;
    }
    function onCommitH() {
      let [m] = matrices;
      vector = vec3.fromVec4(mat4.multiplyVec(vec4.fromVec3(vec3Ref), m));
      inputH.value = "0";
      inputV.value = "0";
      inputState[0] = 0;
      inputState[1] = 0;
      matrices = vectorToMatrices(vector);
    }
    function onDragS(e: Event) {
      // const value = parseFloat((e.target! as HTMLInputElement).value);
      // gimbalState[2] = value;
      // vector = mapGimbalToCartesian(...gimbalState);
      // updateGimbal(...gimbalState);
      // updateListComponent();
      // onChange(vector);
    }
    inputH.addEventListener("input", onDragH);
    inputH.addEventListener("change", onCommitH);
    inputV.addEventListener("input", onDragV);
    inputV.addEventListener("change", onCommitV);
    inputS.addEventListener("input", onDragS);
    applyTransforms();

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
      applyTransforms();
    }

    componentRangeInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('input', onChangeComponent);
    });

    return control;
}
