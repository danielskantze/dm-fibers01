import type { Uniform } from "../types/gl/uniforms";

const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

function sanitizeName(name: string) {
  return name.toLowerCase().split(" ").join("-");
}

export type ControlFactoryUniform = Omit<Uniform, "location" | "slot">;
class ControlFactory {
  private idSeq: number;
  private doc: HTMLDocument;
  private container: HTMLElement;

  get visible(): boolean {
    return this.container.dataset.show === "1";
  }

  set visible(value: boolean) {
    this.container.dataset.show = value ? "1" : "0";
  }
  
  constructor(doc: HTMLDocument, container: HTMLElement) {
    this.doc = doc;
    this.idSeq = 1;
    this.container = container;
  }

  private _createControl(container: HTMLElement, name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number) {
    const wrapper: HTMLDivElement = this.doc.createElement("div");
    const label: HTMLLabelElement = this.doc.createElement("label");
    const input: HTMLInputElement = this.doc.createElement("input");
    const text: HTMLInputElement = this.doc.createElement("input");
    const id: string = sanitizeName(name);
    text.setAttribute("disabled", "disabled");
    text.setAttribute("type", "text");
    text.setAttribute("name", "d_" + id);
    input.setAttribute("name", "r_" + id);
    this.idSeq++;
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
      text.value = value.toFixed(2);
    }
    const inputId = `control_${this.idSeq}`;
    input.id = inputId;
    input.oninput = (e) => {
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      onChange(newValue);
      text.value = newValue.toFixed(2);
    };
    label.textContent = name;
    label.setAttribute("for", inputId);
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(text);
    text.classList.add("digits");
    wrapper.classList.add("parameter");
    container.appendChild(wrapper);
  }

  createScalar(name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number) {
    const container: HTMLDivElement = this.doc.createElement("div");
    container.classList.add("scalar");
    this._createControl(container, name, value, onChange, min, max, step);
    this.container.appendChild(container);
  }

  createVector(name: string, values: number[], onChange: (i: number, value: number) => void, min?: number, max?: number, step?: number) {
    const container: HTMLDivElement = this.doc.createElement("div");
    container.innerText = name;
    container.classList.add("vector");
    container.dataset.collapsed = "1";
    container.onclick = (e:Event) => {
      if (e.currentTarget === e.target) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1"; 
        container.dataset.collapsed = newValue;
      }
    };
    for (let i = 0; i < values.length; i++) {
      this._createControl(container, vecCompName(i), values[i], (v) => onChange(i, v), min, max, step);
    }
    this.container.appendChild(container);
  }

  createButton(title: string, onClick: () => void) {
    const container: HTMLDivElement = this.doc.createElement("div");
    const button: HTMLButtonElement = this.doc.createElement("button");
    container.classList.add("button");
    button.innerText = title;
    button.onclick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    container.appendChild(button);
    this.container.appendChild(container);
  }

  createCosPalette(
    values: [number[], number[], number[], number[]], 
    width: number = 300, 
    height = 20
  ) {
    const container: HTMLDivElement = this.doc.createElement("div");
    const canvas: HTMLCanvasElement = this.doc.createElement("canvas");
    container.appendChild(canvas);
    container.classList.add("palette");
    container.dataset.collapsed = "1";

    container.onclick = (e: Event) => {
      if (e.currentTarget === e.target) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1"; 
        container.dataset.collapsed = newValue;
      }
    };

    function onChange(c: number, i: number, v: number) {
      values[c][i] = v;
      drawPalette();
    }

    for (let c = 0; c < values.length; c++) {
        this.createVector("abcd".charAt(c), values[c], (i, v) => {

        });
    }

    canvas.setAttribute("width", Math.round(width).toString());
    canvas.setAttribute("height", Math.round(height).toString());
    this.container.appendChild(container);

    function cosPalette(t: number, a: number[], b: number[], c: number[], d: number[]) {
      let s = [
        a[0] + b[0] * Math.cos(Math.PI * 2.0 * c[0] * t + d[0]),
        a[1] + b[1] * Math.cos(Math.PI * 2.0 * c[1] * t + d[1]),
        a[2] + b[2] * Math.cos(Math.PI * 2.0 * c[2] * t + d[2])
      ];
      return [
        Math.floor(255.0 * s[0]),
        Math.floor(255.0 * s[1]),
        Math.floor(255.0 * s[2])
      ];
    }
    const ctx = canvas.getContext("2d");

    function drawPalette() {
      ctx!.lineWidth = 1.0;
      for (let x = 0; x < width; x++) {
        const t = x / width;
        const c = cosPalette(t, ...values);
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.strokeStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]}`;
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }
    }
    drawPalette();
  }
}

export default ControlFactory;