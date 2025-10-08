import type { Matrix4x3, Vec3 } from "../../../math/types";
import { createVec3 } from "../vec3";

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gridTemplateRows: "repeat(2, 1fr)",
  gridColumnGap: "0px",
  gridRowGap: "0px"
};

export function createCosPalette(
    values: Matrix4x3,
    width: number = 320,
    height = 20
): HTMLElement {
    const container: HTMLDivElement = document.createElement("div");
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const components: HTMLDivElement = document.createElement("div");
    for (let k in gridStyle) {
      components.style[k as any] = (gridStyle as any)[k as any] as any;
    }
    container.appendChild(canvas);
    container.appendChild(components);
    container.classList.add("palette");
    container.dataset.collapsed = "1";

    ["a", "b", "c", "d"].forEach((name, i) => {
      const vec3 = createVec3(name, values.slice(i * 3) as Vec3, (v) => {
        values[i * 3] = v[0];
        values[i * 3 + 1] = v[1];
        values[i * 3 + 2] = v[2];
        requestAnimationFrame(drawPalette);
      }, [0, 0, 0], [1.0, 1.0, 1.0]);
      components.appendChild(vec3);
    });

    container.onclick = (e: Event) => {
      if (e.currentTarget === e.target) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1";
        container.dataset.collapsed = newValue;
      }
    };

    canvas.setAttribute("width", Math.round(width).toString());
    canvas.setAttribute("height", Math.round(height).toString());

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
