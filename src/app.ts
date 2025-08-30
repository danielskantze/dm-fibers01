import './style.css';
import main from './main';

document.getElementById('app')!.innerHTML = `
  <canvas id="canvas"></canvas>
`;

main(document.getElementById('canvas')! as HTMLCanvasElement);