import type { Matrix4x3, Vec3 } from "../../../math/types";
import { createVec3, type Vec3Params } from "../vec3";
import "./cos-palette.css";
import template from './cos-palette.html?raw';

function cosPalette(t: number, m: Matrix4x3) {
  const a = m.slice(0, 3);
  const b = m.slice(3, 6);
  const c = m.slice(6, 9);
  const d = m.slice(9);
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
    width: number = 320,
    height = 1
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;

    const container = wrapper.querySelector('.cos-palette') as HTMLDivElement;
    const canvas = wrapper.querySelector('.palette') as HTMLCanvasElement;
    const components = wrapper.querySelector('.components') as HTMLDivElement;
    const expandRadio = wrapper.querySelector('.cos-palette .expand-checkbox') as HTMLInputElement;
    container.dataset.collapsed = "1";


    const vec3Params: Partial<Vec3Params> = {
      minVal: [0, 0, 0],
      maxVal: [1, 1, 1],
      expandable: false
    };

    ["a", "b", "c", "d"].forEach((name, i) => {
      const vec3 = createVec3(name, values.slice(i * 3, i * 3 + 3) as Vec3, (v) => {
        values[i * 3] = v[0];
        values[i * 3 + 1] = v[1];
        values[i * 3 + 2] = v[2];
        requestAnimationFrame(drawPalette);
      }, vec3Params);
      components.appendChild(vec3);
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
        const c = cosPalette(t, values);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.strokeStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]}`;
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    drawPalette();
    return container;
}
