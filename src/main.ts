// import * as stage_test from "./render/stages/test";
import type { Matrix4x3, Vec3 } from "./math/types";
import * as stage_accumulate from "./render/stages/accumulate";
import * as stage_blur from "./render/stages/blur";
import * as stage_combine from "./render/stages/combine";
import * as stage_display from "./render/stages/display";
import * as stage_luma from "./render/stages/luma";
import * as stage_materialize from "./render/stages/materialize";
import * as stage_simulate from "./render/stages/simulate";
import { WebGLTextureError } from "./types/error";
import { UniformComponents, type Uniform, type UniformType, type UniformUI } from "./types/gl/uniforms";
import { type Settings } from "./types/settings";
import { createButtons } from "./ui/components/buttons";
import { createCosPalette } from "./ui/components/cos-palette";
import { createScalar } from "./ui/components/scalar";
import { createVec3 } from "./ui/components/vec3";
import { createVector } from "./ui/components/vector";
import ControlFactory from "./ui/controls";

export type ControlFactoryUniform = Omit<Uniform, "location" | "slot">;

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

function createUniformControls(controlsContainer: HTMLElement, uniforms: ControlFactoryUniform[]) {
    for (const u of uniforms) {
        const { ui } = u;
        if (ui) {
            const { name, min, max, step, component } = u.ui!;
            const numComponents = UniformComponents[u.type!]!;
            if (component === "cos-palette") {
              controlsContainer.appendChild(
                createCosPalette(u.value as Matrix4x3)
              )
            } else if (numComponents > 1) {
                const values = u.value as number[];
                if (numComponents === 3) {
                  controlsContainer.appendChild(
                    createVec3(name, values as Vec3, 
                      (v: Vec3) => { 
                        values[0] = v[0]; 
                        values[1] = v[1]; 
                        values[2] = v[2]; 
                      }
                    )
                  );
                } else {
                  controlsContainer.appendChild(createVector(name, values, (i: number, v: number) => { values[i] = v; }, min, max, step));
                }
            } else {
                const value = u.value as number;
                controlsContainer.appendChild(createScalar(name, value, (v: number) => { u.value = v; }, min, max, step));
            }
        }
    }
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
    controlsContainer: HTMLElement,
    parameters: ControlFactoryUniform[],
    resetFn: () => void,
    pauseFn: () => void,
    toggleVisibilityFn: () => void,
) {
    createUniformControls(controlsContainer, parameters);
    controlsContainer.appendChild(createButtons([
        {title: "Clear", onClick: () => { resetFn(); }, color: 2},
        {title: "Pause", onClick: pauseFn, color: 2}
    ]));

    document.addEventListener("keypress", (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.charCodeAt(0) === 112) { // 112 = p
        toggleVisibilityFn();
      }
    });
}

function createUIParameter(type: UniformType, value: number | number[], ui: UniformUI): ControlFactoryUniform {
    return { type, value, ui };
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
    const controlFactory = new ControlFactory(controls);
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
    createUi(controls, [numParticlesParam, accumulateParam, bloomIntensityParam, lumaThresholdParam, ...simulateStage.parameters],
        () => { resize(); },
        () => {
            isRunning = !isRunning;
            if (!isRunning) {
              elapsedTime += (performance.now() - startTime) / 1000;
            } else {
              startTime = performance.now();
              draw();
            }
        },
        () => {
            controlFactory.visible = !controlFactory.visible;
        }
    );

    window.addEventListener("resize", resize);
    //draw();
}

export default main;

// TODO:

// Improved palette parameter 
//  - Change cos palette params to be a unit instead of individual vectors (use Matrix3x4 or Matrix4x4). This way we will not have to map it to multiple uniforms which is nice. We need to figure out the component mapping though. 
//  - Introduce special uniform type cos-palette and group implicitly in order or occurence
//  - Make vec3 width component-specific (i.e. smaller ones for cos palette so we can fit 2 per row)
//  - Hook up cos-palette to createUI and make it handle onChange properly (remove POC hack)
//  - createCosPalette should manage its own vec3 components
//  - Fold-out should expand all

// Improved styling of parameters - update all to new dark theme
// Make UI scrollable (handle case when many params are expanded)

// Expose particle fade time as parameter

// Make vector field less jittery
// Toggle trail
// Store parameters
// Screenshot function
// Random seed

// Add music.
// - Sync beats with stroke noise x/y (each kick will pulse these)
// - Also pulsate stroke radius (maybe for a new section?)
// - Possibly tune palette x/y too
// - Experiment with syncing particle start time too (high intensity - particle restarts immediately)
// - And of course, test controlling number of particles (possibly relate to radius)

// 3D support (each particle has Z component)

// Consider adding LFOs

// Make post chain pluggable and easier to rearrange (array of steps)