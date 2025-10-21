import { getRow } from "../../../math/mat43";
import type { Matrix4x3 } from "../../../math/types";
import type { UniformValue } from "../../../types/gl/uniforms";
import type { UIComponent, UIComponentValue } from "../types";
import { createVec3, type Vec3Params } from "../vec3";
import * as mat43 from "../../../math/mat43";
import "./cos-palette.css";
import template from './cos-palette.html?raw';

function cosPalette(t: number, m: Matrix4x3) {
  const a = mat43.getRow(0, m);
  const b = mat43.getRow(1, m);
  const c = mat43.getRow(2, m);
  const d = mat43.getRow(3, m);
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

export function createCosPalette(
    values: Matrix4x3,
    onChange: (value: Matrix4x3) => void, 
    width: number = 320,
    height = 1
): UIComponent {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;

    let matrix = mat43.copy(values);

    const container = wrapper.querySelector('.cos-palette') as HTMLDivElement;
    const canvas = wrapper.querySelector('.palette') as HTMLCanvasElement;
    const components = wrapper.querySelector('.components') as HTMLDivElement;
    const componentUpdateFns: ((value: UniformValue) => void)[] = [];
    const expandRadio = wrapper.querySelector('.cos-palette .expand-checkbox') as HTMLInputElement;
    container.dataset.collapsed = "1";

    const vec3Params: Partial<Vec3Params> = {
      minVal: [0, 0, 0],
      maxVal: [1, 1, 1],
      expandable: false
    };

    ["a", "b", "c", "d"].forEach((name, i) => {
      const vec3 = createVec3(name, getRow(i, matrix), (v) => {
        mat43.setRow(i, v, matrix);
        onChange(matrix);
        requestAnimationFrame(drawPalette);
      }, vec3Params);
      components.appendChild(vec3.element);
      componentUpdateFns.push(vec3.update);
    });

    container.onclick = (e: Event) => {
      if (e.currentTarget === e.target) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1";
        container.dataset.collapsed = newValue;
      }
    };

    expandRadio.addEventListener('click', () => {
      const isCollapsing = container.dataset.collapsed === "0";
      container.dataset.collapsed = isCollapsing ? "1" : "0";
      expandRadio.checked = !isCollapsing;
    });

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
      update: (value: UIComponentValue) => {
        const m = value as Matrix4x3;
        matrix.set(m);
        componentUpdateFns[0](getRow(0, m));
        componentUpdateFns[1](getRow(1, m));
        componentUpdateFns[2](getRow(2, m));
        componentUpdateFns[3](getRow(3, m));
        drawPalette();
      }
    }
}
