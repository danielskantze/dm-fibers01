import { getRow } from "../../../math/mat43";
import type { Matrix4x3 } from "../../../math/types";
import type { Component } from "../types";
import { createVec3, type Vec3Component, type Vec3Params } from "../vec3";
import * as mat43 from "../../../math/mat43";
import * as vec3 from "../../../math/vec3";
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

export function createCosPalette(
  values: Matrix4x3,
  onChange: (value: Matrix4x3) => void,
  width: number = 320,
  height = 1
): Component {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template;

  let matrix = mat43.copy(values);

  const container = wrapper.querySelector(".cos-palette") as HTMLDivElement;
  const canvas = wrapper.querySelector(".palette") as HTMLCanvasElement;
  const components = wrapper.querySelector(".components") as HTMLDivElement;
  const children: Vec3Component[] = [];
  const expandRadio = wrapper.querySelector(
    ".cos-palette .expand-checkbox"
  ) as HTMLInputElement;
  container.dataset.collapsed = "1";

  const vec3Params: Partial<Vec3Params> = {
    minVal: vec3.fromValues(0, 0, 0),
    maxVal: vec3.fromValues(1, 1, 1),
    expandable: false,
  };

  ["a", "b", "c", "d"].forEach((name, i) => {
    const child = createVec3(
      name,
      getRow(i, matrix),
      v => {
        mat43.setRow(i, v, matrix);
        onChange(matrix);
        requestAnimationFrame(drawPalette);
      },
      vec3Params
    );
    components.appendChild(child.element);
    children.push(child);
  });

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
    update: (value: Matrix4x3) => {
      const m = value as Matrix4x3;
      matrix.set(m);
      children[0].update(getRow(0, m));
      children[1].update(getRow(1, m));
      children[2].update(getRow(2, m));
      children[3].update(getRow(3, m));
      drawPalette();
    },
    destroy: () => {
      container.removeEventListener("click", onContainerClick);
      expandRadio.removeEventListener("click", onExpandClick);
      for (const child of children) {
        child.destroy!();
      }
    },
  };
}
