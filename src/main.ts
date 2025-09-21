// import * as stage_test from "./render/stages/test";
import * as stage_simulate from "./render/stages/simulate";
import * as stage_materialize from "./render/stages/materialize";
import * as stage_accumulate from "./render/stages/accumulate";
import * as stage_blur from "./render/stages/blur";
import * as stage_luma from "./render/stages/luma";
import * as stage_display from "./render/stages/display";
import * as stage_combine from "./render/stages/combine";
import { WebGLTextureError } from "./types/error";
import { UniformComponents, type UniformType, type UniformUI } from "./types/gl/uniforms";
import ControlFactory, { type ControlFactoryUniform } from "./ui/controls";
import { type Settings } from "./types/settings";

const settings: Settings = {
    width: window.screen.width,
    height: window.screen.height,
    msaa: undefined
}

function configureCanvas(canvas: HTMLCanvasElement) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
}

function createUniformControls(factory: ControlFactory, uniforms: ControlFactoryUniform[]) {
    for (const u of uniforms) {
        const { ui } = u;
        if (ui) {
            const { name, min, max, step } = u.ui!;
            const numComponents = UniformComponents[u.type!]!;
            if (numComponents > 1) {
                const values = u.value as number[];
                factory.createVector(name, values, (i, v) => { values[i] = v; }, min, max, step);
            } else {
                const value = u.value as number;
                factory.createScalar(name, value, (v) => { u.value = v; }, min, max, step);
            }
        }
    }
    factory.createCosPalette([[0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5],
    [1.0, 1.0, 1.0],
    [0.0, 0.9, 0.9]]);
}

function textureSizeFromNumParticles(numParticles: number, maxNumParticles: number): [number, number] {
    let pts = numParticles;
    if (pts > maxNumParticles) {
        pts = maxNumParticles;
    }
    const w = Math.floor(Math.sqrt(pts));
    return [w, w];
}

function createUi(
    controlFactory: ControlFactory,
    parameters: ControlFactoryUniform[],
    resetFn: () => void,
    pauseFn: () => void,
) {
    createUniformControls(controlFactory, parameters);
    controlFactory.createButton("Clear", () => {
        resetFn();
    });
    controlFactory.createButton("Pause", pauseFn);
}

function createUIParameter(type: UniformType, value: number | number[], ui: UniformUI): ControlFactoryUniform {
    return { type, value, ui };
}

function logDebug(text: string, force: boolean = false) {
    const debug = document.getElementById("debug")!;
    if (!force) {
        debug.innerHTML += text + "<br>";
    } else {
        debug.innerHTML = text;
    }
}

function main(canvas: HTMLCanvasElement, controls: HTMLDivElement) {
    configureCanvas(canvas);
    let isRunning = true;
    let elapsedTime = 0;
    let startTime = performance.now();
    const maxNumParticles = 4 * 50000;
    let numParticlesParam = createUIParameter("int", 1000, {
        name: "Particles",
        min: 10,
        max: maxNumParticles
    });
    let accumulateParam = createUIParameter("int", 1, {
        name: "Accumulate",
        min: 0,
        step: 1,
        max: 1
    });
    let bloomIntensityParam = createUIParameter("float", 0.5, {
        name: "Bloom",
        min: 0,
        step: 0.01,
        max: 1.0
    });
    let lumaThresholdParam = createUIParameter("float", 0.25, {
        name: "Luma",
        min: 0,
        step: 0.01,
        max: 1.0
    });    
    const controlFactory = new ControlFactory(document, controls);
    const gl = canvas.getContext("webgl2")!
    let ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      throw new WebGLTextureError("This browser does not support rendering to float textures");
    }
    ext = gl.getExtension("EXT_color_buffer_half_float");
    if (!ext) {
      throw new WebGLTextureError("This browser does not support rendering to half float textures");
    }
    const simulateStage = stage_simulate.create(gl, maxNumParticles);
    //const testStage = stage_test.create(gl, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio;
    const renderWidth = settings.width * dpr;
    const renderHeight = settings.height * dpr;


    const materializeStage = stage_materialize.create(gl, simulateStage, renderWidth, renderHeight, maxNumParticles, settings.msaa);
    const accumulateStage = stage_accumulate.create(gl, materializeStage);
    const lumaStage = stage_luma.create(gl, accumulateStage);
    const blurStage = stage_blur.create(gl, lumaStage, "high", 7);
    const combineStage = stage_combine.create(gl, accumulateStage);
    const displayStage = stage_display.create(gl, combineStage);
    let frame = 0;

    function draw() {
        if (!isRunning) {
            return;
        }
        const time = elapsedTime + (performance.now() - startTime) / 1000;
        for (let i = 0; i < 4; i++) {
            const numParticles = numParticlesParam.value as number;
            const drawSize = textureSizeFromNumParticles(numParticles, maxNumParticles);
            stage_simulate.draw(gl, simulateStage, time, frame, drawSize);
            stage_materialize.draw(gl, materializeStage, time, frame, numParticles);
            stage_accumulate.draw(gl, accumulateStage, time, frame);
            stage_luma.draw(gl, lumaStage, lumaThresholdParam.value as number);
            stage_blur.draw(gl, blurStage);
            stage_combine.draw(gl, combineStage, blurStage, 1.0, bloomIntensityParam.value as number);
            stage_display.draw(gl, displayStage, canvas.width, canvas.height);
            frame++;
        }
        requestAnimationFrame(() => {
            draw();
        });
    }

    function resize() {
        configureCanvas(canvas);
    }

    createUi(controlFactory, [numParticlesParam, accumulateParam, bloomIntensityParam, lumaThresholdParam, ...simulateStage.parameters],
        () => { resize(); },
        () => {
            isRunning = !isRunning;
            if (!isRunning) {
              elapsedTime += (performance.now() - startTime) / 1000;
            } else {
              startTime = performance.now();
              draw();
            }
        }
    );

    window.addEventListener("resize", resize);
    draw();
}

export default main;

// TODO:

// Expose parameter for MSAA
// Show / hide parameters on keypress

// Add bloom filter step (think of other post processing effects, e.g. motion blur)
// Palette editor
// Make post chain pluggable and easier to rearrange (array of steps)

// Add music.
// - Sync beats with stroke noise x/y (each kick will pulse these)
// - Also pulsate stroke radius (maybe for a new section?)
// - Possibly tune palette x/y too
// - Experiment with syncing particle start time too (high intensity - particle restarts immediately)
// - And of course, test controlling number of particles (possibly relate to radius)

// Consider adding LFOs
