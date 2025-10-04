import type { Matrix4x4, Vec3 } from "../../../math/types";
import { mapCartesianToGimbal, mapGimbalToCartesian } from "../../../math/gimbal";
import template from './vec3.html?raw';
import './vec3.css';
import { createVec3GimbalView } from "../../3d/vec3-gimbal";
import * as mat4 from "../../../math/mat4";
import * as mat3 from "../../../math/mat3";
import * as vec3 from "../../../math/vec3";
import * as vec4 from "../../../math/vec4";

const practicallyZero = 0.00001;
class Vec3State {
    public rotX: number = 0.0;
    public rotZ: number = 0.0;
    public length: number = 1.0;
    private refV: Vec3;

    constructor(v: Vec3, refV: Vec3 = [0, -1, 0]) {
        this.refV = refV;
        this.value = v;
    }

    private get safeScale(): number {
        const al = Math.abs(this.length);
        if (al < practicallyZero) {
            return this.length >= 0 ? practicallyZero : -practicallyZero;
        }
        return this.length;
    }

    public get matrix(): Matrix4x4 {
        const mX = mat4.rotateX(this.rotX);
        const mZ = mat4.rotateZ(-this.rotZ);
        return mat4.multiplyMatMulti(mX, mZ);
    }

    public get matrixI(): Matrix4x4 {
        const mX = mat4.rotateX(-this.rotX);
        const mZ = mat4.rotateZ(this.rotZ);
        return mat4.multiplyMatMulti(mZ, mX);
    }    

    public get value(): Vec3 {
        const v4 = vec4.fromVec3(this.refV);
        const v = vec3.fromVec4(mat4.multiplyVec(v4, this.matrix));
        v[1] = -v[1];
        v[2] = -v[2];
        return v;
    }

    public set value(v: Vec3) {
      const vn = vec3.normalize(v);
      this.length = vec3.length(v);
      this.rotX = Math.asin(vn[2]);
      this.rotZ = Math.atan2(vn[0], vn[1]);
    }

}


export function createVec3(name: string, value: Vec3, onChange: (value: Vec3) => void): HTMLElement {
    const state = new Vec3State(value);
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
            updateGimbal(state.matrix, state.matrixI, state.length);
            initializeControls();
        }
      };
    });

    
    // 3D

    const inputH = control.querySelector(".controls > input.horizontal") as HTMLInputElement;
    const inputV = control.querySelector(".controls > input.vertical") as HTMLInputElement;
    const inputS = control.querySelector(".controls > input.length") as HTMLInputElement;

    const { canvas, update: updateGimbal } = createVec3GimbalView(internalWidth, internalHeight);

    function initializeControls() {
        inputH.value = (state.rotX / Math.PI).toString();
        inputV.value = (state.rotZ / Math.PI).toString();
        inputS.value = state.length.toString();
        updateListComponent();
    }

    initializeControls();

    function logState() {
        console.log("rotX",
            (state.rotX * 180 / Math.PI).toFixed(0),
            "rotZ",
            (state.rotZ * 180 / Math.PI).toFixed(0),
            "v: [", state.value[0].toFixed(2), state.value[1].toFixed(2), state.value[2].toFixed(2), "]");
        console.log(
          "inputH.value", inputH.value, 
          "inputV.value", inputV.value,
          "inputS.value", inputS.value);
    }

    function onDragV() {
      state.rotZ = parseFloat(inputV.value) * Math.PI;
      updateGimbal(state.matrix, state.matrixI, state.length);
      logState();
    }
    function onDragH() {
      state.rotX = parseFloat(inputH.value) * Math.PI;
      updateGimbal(state.matrix, state.matrixI, state.length);
      logState();
    }
    function onDragS() {
      state.length = parseFloat(inputS.value);
      updateGimbal(state.matrix, state.matrixI, state.length);
      logState();
    }
    inputH.addEventListener("input", onDragH);
    inputV.addEventListener("input", onDragV);
    inputS.addEventListener("input", onDragS);

    canvasContainer!.appendChild(canvas);

    updateGimbal(state.matrix, state.matrixI, state.length);
    logState();
    // LIST

    function updateListComponent() {
      const vector = state.value;
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
      const v = state.value;
      v[c] = parseFloat(inputElmt.value);
      state.value = v;
    }

    componentRangeInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('input', onChangeComponent);
    });

    return control;
}
