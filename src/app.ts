import "./style.css";
import main from "./main";

document.getElementById("app")!.innerHTML = `
  <canvas id="canvas"></canvas>
  <div id="controls" />
`;

main(
  document.getElementById("canvas")! as HTMLCanvasElement,
  document.getElementById("controls")! as HTMLDivElement
);
