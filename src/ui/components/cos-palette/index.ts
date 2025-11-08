import type { Matrix4x3 } from "../../../math/types";
import type { UniformValue } from "../../../types/gl/uniforms";
import type { ParameterComponent } from "../types";
import { createVec3 } from "../vec3";
import * as mat43 from "../../../math/mat43";
import "./cos-palette.css";
import template from "./cos-palette.html?raw";

function cosPalette(t: number, m: Matrix4x3) {
  const a = mat43.getRow(0, m);
  const b = mat43.getRow(1, m);
  const c = mat43.getRow(2, m);
  const d = mat43.getRow(3, m);
  let s = [
    a[0] + b[0] * Math.cos(Math.PI * 2.0 * c[0] * t + d[0]),
    a[1] + b[1] * Math.cos(Math.PI * 2.0 * c[1] * t + d[1]),
    a[2] + b[2] * Math.cos(Math.PI * 2.0 * c[2] * t + d[2]),
  ];
  return [Math.floor(255.0 * s[0]), Math.floor(255.0 * s[1]), Math.floor(255.0 * s[2])];
}

export type CosPaletteProps = {
  values: Matrix4x3;
  onChange: (value: Matrix4x3) => void;
};

export function createCosPalette({
  values,
  onChange,
}: CosPaletteProps): ParameterComponent {
  const width = 320;
  const height = 1;
  let matrix = mat43.copy(values);
  const vec3A = createVec3({
    name: "A",
    values: mat43.getRow(0, values),
    onChange: v => {
      mat43.setRow(0, v, matrix);
      onChange(matrix);
      requestAnimationFrame(drawPalette);
    },
    params: { expandable: false },
  });
  const vec3B = createVec3({
    name: "B",
    values: mat43.getRow(1, values),
    onChange: v => {
      mat43.setRow(1, v, matrix);
      onChange(matrix);
      requestAnimationFrame(drawPalette);
    },
    params: { expandable: false },
  });
  const vec3C = createVec3({
    name: "C",
    values: mat43.getRow(2, values),
    onChange: v => {
      mat43.setRow(2, v, matrix);
      onChange(matrix);
      requestAnimationFrame(drawPalette);
    },
    params: { expandable: false },
  });
  const vec3D = createVec3({
    name: "D",
    values: mat43.getRow(3, values),
    onChange: v => {
      mat43.setRow(3, v, matrix);
      onChange(matrix);
      requestAnimationFrame(drawPalette);
    },
    params: { expandable: false },
  });

  const element = document.createElement("div");
  element.innerHTML = template;

  const container = element.querySelector(".cos-palette") as HTMLDivElement;
  const canvas = element.querySelector(".palette") as HTMLCanvasElement;
  const components = element.querySelector(".components") as HTMLDivElement;
  const children: ParameterComponent[] = [];
  const expandRadio = element.querySelector(
    ".cos-palette .expand-checkbox"
  ) as HTMLInputElement;
  container.dataset.collapsed = "1";

  components.appendChild(vec3A.element);
  components.appendChild(vec3B.element);
  components.appendChild(vec3C.element);
  components.appendChild(vec3D.element);
  children.push(vec3A);
  children.push(vec3B);
  children.push(vec3C);
  children.push(vec3D);

  const onContainerClick = (e: Event) => {
    if (e.currentTarget === e.target) {
      const newValue = container.dataset.collapsed === "1" ? "0" : "1";
      container.dataset.collapsed = newValue;
    }
  };
  container.addEventListener("click", onContainerClick);

  const onExpandClick = () => {
    const isCollapsing = container.dataset.collapsed === "0";
    container.dataset.collapsed = isCollapsing ? "1" : "0";
    expandRadio.checked = !isCollapsing;
  };
  expandRadio.addEventListener("click", onExpandClick);

  canvas.setAttribute("width", Math.round(width).toString());
  canvas.setAttribute("height", Math.round(height).toString());

  const ctx = canvas.getContext("2d");

  function drawPalette() {
    if (!ctx) return;
    ctx.lineWidth = 1.0;
    for (let x = 0; x < width; x++) {
      const t = x / width;
      const c = cosPalette(1.0 - t, matrix);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.strokeStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]}`;
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
  drawPalette();
  return {
    element: container,
    update: (value: UniformValue) => {
      if (!(value instanceof Float32Array) || value.length !== 12) {
        console.warn("CosPalette component received non-mat4x3 value:", value);
        return;
      }
      const m = value as Matrix4x3;
      if (mat43.equals(matrix, m)) {
        return;
      }
      matrix.set(m);
      children[0].update(mat43.getRow(0, m));
      children[1].update(mat43.getRow(1, m));
      children[2].update(mat43.getRow(2, m));
      children[3].update(mat43.getRow(3, m));
      drawPalette();
    },
    destroy: () => {
      container.removeEventListener("click", onContainerClick);
      expandRadio.removeEventListener("click", onExpandClick);
      for (const child of children) {
        child.destroy?.();
      }
    },
  };
}
