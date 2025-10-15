import * as mat4 from "../../../math/mat4";
import type { Matrix4x4, Vec3 } from "../../../math/types";
import * as vec3 from "../../../math/vec3";
import * as vec4 from "../../../math/vec4";
import type { UniformValue } from "../../../types/gl/uniforms";
import { createVec3GimbalView } from "../../3d/vec3-gimbal";
import type { UIComponent } from "../types";
import './vec3.css';
import template from './vec3.html?raw';
class Vec3State {
    public rotX: number = 0.0;
    public rotZ: number = 0.0;
    public length: number = 1.0;
    private refV: Vec3;

    constructor(v: Vec3, refV: Vec3 = [0, -1, 0]) {
        this.refV = refV;
        this.value = v;
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
        v[2] = v[2];
        return vec3.scale(v, this.length);
    }

    public set value(v: Vec3) {
      const vn = vec3.normalize(v);
      if (v[0] === 0 && v[1] === 0 && v[2] === 0) {
        this.length = 0;
        this.rotX = 0;
        this.rotZ = 0;
        return;
      }
      this.length = vec3.length(v);
      this.rotX = vn[2] === 0 ? 0 : Math.asin(vn[2]);
      this.rotZ = Math.atan2(vn[0], vn[1]);
    }
}

// TEST & DEBUG

// function logVec3StateTests() {
//   let testValues: Vec3[] = [
//     vec3.normalize([0.25, 0.75, 0.92] as Vec3),
//     vec3.normalize([0.25, -0.75, -0.92] as Vec3),
//     [0.25, 0.75, 0.92] as Vec3,
//     [0.25, -0.75, -0.92] as Vec3
//   ]
//   for (let tv of testValues) {
//     let isNorm = Math.abs(vec3.length(tv) - 1.0) < 0.000001;
//     console.log("Before: ", `[${tv[0].toFixed(2)}, ${tv[1].toFixed(2)}, ${tv[2].toFixed(2)}]${isNorm ? ' N': ''}`, );
//     let sv = (new Vec3State(tv)).value;
//     isNorm = Math.abs(vec3.length(sv) - 1.0) < 0.000001;
//     console.log("After: ", `[${sv[0].toFixed(2)}, ${sv[1].toFixed(2)}, ${sv[2].toFixed(2)}]${isNorm ? ' N': ''}`, );
//   }
// }

// function logComponentState(state: Vec3State) {
//   console.log("rotX",
//       (state.rotX * 180 / Math.PI).toFixed(0),
//       "rotZ",
//       (state.rotZ * 180 / Math.PI).toFixed(0),
//       "v: [", state.value[0].toFixed(2), state.value[1].toFixed(2), state.value[2].toFixed(2), "]");
// }

class DomainMapping {
  private aMin: Vec3;
  private aMax: Vec3;
  private aDist: Vec3;
  private bMin: Vec3;
  private bMax: Vec3;
  private bDist: Vec3;

  constructor(aMin: Vec3, aMax: Vec3, bMin: Vec3, bMax: Vec3) {
    this.aMin = aMin;
    this.aMax = aMax;
    this.bMin = bMin;
    this.bMax = bMax;
    this.aDist = vec3.sub(aMax, aMin);
    this.bDist = vec3.sub(bMax, bMin);
  }

  clampA(v:Vec3): Vec3 {
    return vec3.max(vec3.min(v, this.aMax), this.aMin);
  }
  
  clampB(v:Vec3): Vec3 {
    return vec3.max(vec3.min(v, this.bMax), this.bMin);
  }

  // target domain
  fromBToA(v:Vec3, clamp: boolean = false): Vec3 {
    const r = vec3.add(
      this.aMin, 
      vec3.mul(
        vec3.div(vec3.sub(v, this.bMin), this.bDist), 
        this.aDist)
    );
    return clamp ? this.clampA(r) : r;
  }

  // internal domain
  fromAToB(v: Vec3, clamp: boolean = false): Vec3 {
    const r = vec3.add(
      this.bMin, 
      vec3.mul(
        vec3.div(vec3.sub(v, this.aMin), this.aDist), 
        this.bDist)
    );
    return clamp ? this.clampB(r) : r;
  }
}

export type Vec3Params = {
  minVal: Vec3,
  maxVal: Vec3,
  inputPrecision: number,
  expandable: boolean,
};

const defaultVec3Params: Vec3Params = {
  minVal: [0, 0, 0] as Vec3,
  maxVal: [1, 1, 1] as Vec3,
  inputPrecision: 5,
  expandable: true
};

function getCssVar(element: HTMLElement, property: string): string {
  const style = window.getComputedStyle(element)!;
  const value = style.getPropertyValue(property);
  return value;
}

export function createVec3(name: string, value: Vec3, onChange: (value: Vec3) => void, params: Partial<Vec3Params> = defaultVec3Params): UIComponent {
  const {minVal, maxVal, inputPrecision, expandable } = {...defaultVec3Params, ...params};
  const mapper = new DomainMapping(minVal, maxVal, [-1, -1, -1], [1, 1, 1]);
    const state = new Vec3State(mapper.fromAToB(value, true));
    // TODO: Continue with mapper implementation

    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;
    const control = wrapper.firstElementChild as HTMLDivElement;

    control.dataset.expanded = expandable ? "0" : "1";
    const label = control.querySelector('header .label')! as HTMLDivElement;
    const expandRadio = control.querySelector('header .expand-checkbox')! as HTMLInputElement;
    const panelSelectors = control.querySelectorAll('header .panel-selector *[data-type]');
    const panels = control.querySelector('.panels') as HTMLDivElement;
    const canvasContainer = control.querySelector('.gimbal') as HTMLDivElement;

    const componentRangeInputs = control.querySelectorAll('.list-control input[type="range"]') as NodeListOf<HTMLInputElement>;
    const componentNumberInputs = control.querySelectorAll('.list-control input[type="number"]') as NodeListOf<HTMLInputElement>;

    function getVec3InternalSize(): [number, number] {
      const uiWidth = parseInt(getCssVar(document.body, '--ui-width'));
      const outerPadding = parseInt(getCssVar(document.body, '--component-padding'));
      const rangeHeight = parseInt(getCssVar(document.body, '--component-range-height'));
      const width = uiWidth * 0.5 - 2 * outerPadding - 2 * rangeHeight;
      return [width, width];
    }

    const [internalWidth, internalHeight] = getVec3InternalSize();

    // FRAME & PANEL

    label.innerHTML = name;

    if (expandable) {
      expandRadio.onclick = (e: Event) => {
        if (e.currentTarget === e.target) {
          const newValue = control.dataset.expanded === "1" ? "0" : "1";
          control.dataset.expanded = newValue;
          expandRadio.checked = newValue === "1";
        }
      };
    } else {
      expandRadio.parentElement?.removeChild(expandRadio);
    }
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

    function onDragV() {
      state.rotZ = parseFloat(inputV.value) * Math.PI;
      updateGimbal(state.matrix, state.matrixI, state.length);
      onChange(mapper.fromBToA(state.value));
    }
    function onDragH() {
      state.rotX = parseFloat(inputH.value) * Math.PI;
      updateGimbal(state.matrix, state.matrixI, state.length);
      onChange(mapper.fromBToA(state.value));
    }
    function onDragS() {
      state.length = parseFloat(inputS.value);
      updateGimbal(state.matrix, state.matrixI, state.length);
      onChange(mapper.fromBToA(state.value));
    }
    inputH.addEventListener("input", onDragH);
    inputV.addEventListener("input", onDragV);
    inputS.addEventListener("input", onDragS);
    canvasContainer!.appendChild(canvas);
    
    // LIST

    function updateListComponent() {
      const vector = state.value;
      const aVector = mapper.fromBToA(vector, true);
      componentRangeInputs.forEach((node: Node, c: number) => {
        const inputElmt = node as HTMLInputElement;
        inputElmt.value = vector[c].toPrecision(inputPrecision);
        componentNumberInputs[c].value = aVector[c].toPrecision(5);
      });
    }

    function setComponentValues(v: Vec3) {
      const b = mapper.fromAToB(v, true);
      componentRangeInputs[0]!.value = b[0].toPrecision(inputPrecision);
      componentNumberInputs[0]!.value = v[0].toPrecision(inputPrecision);
      componentRangeInputs[1]!.value = b[1].toPrecision(inputPrecision);
      componentNumberInputs[1]!.value = v[1].toPrecision(inputPrecision);
      componentRangeInputs[2]!.value = b[2].toPrecision(inputPrecision);
      componentNumberInputs[2]!.value = v[2].toPrecision(inputPrecision);
      state.value = b;
    }

    function onChangeComponent(e: Event) {
      const inputElmt = e.target as HTMLInputElement;
      const c = parseInt(inputElmt.dataset.component ?? "0");
      const v = state.value;
      let newValue = parseFloat(inputElmt.value);
      if (inputElmt.type === "number") {
        newValue = mapper.fromAToB([newValue, 1, 1], true)[0];
      }
      v[c] = newValue;
      const aV = mapper.fromBToA(v, true);
      componentRangeInputs[c]!.value = v[c].toPrecision(inputPrecision);
      componentNumberInputs[c]!.value = aV[c].toPrecision(inputPrecision);
      state.value = v;
      onChange(mapper.fromBToA(state.value));
    }

    componentRangeInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('input', onChangeComponent);
    });

    componentNumberInputs.forEach((node) => {
      const inputElmt = node as HTMLInputElement;
      inputElmt.addEventListener('change', onChangeComponent);
    });

    // INIT

    updateGimbal(state.matrix, state.matrixI, state.length);
    initializeControls();

    return {
      element: control,
      update: (value: UniformValue) => {
        setComponentValues(value as Vec3);
        updateGimbal(state.matrix, state.matrixI, state.length);
        initializeControls();
      }
    }
}
