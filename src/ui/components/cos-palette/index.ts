import { createVector } from "../vector";

export function createCosPalette(
    values: [number[], number[], number[], number[]],
    width: number = 300,
    height = 20
): HTMLElement {
    const container: HTMLDivElement = document.createElement("div");
    const canvas: HTMLCanvasElement = document.createElement("canvas");
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
      container.appendChild(createVector("abcd".charAt(c), values[c], (i, v) => {
        onChange(c, i, v);
      }));
    }

    canvas.setAttribute("width", Math.round(width).toString());
    canvas.setAttribute("height", Math.round(height).toString());

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
      if (!ctx) return;
      ctx.lineWidth = 1.0;
      for (let x = 0; x < width; x++) {
        const t = x / width;
        const c = cosPalette(t, ...values);
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
