import type { Buffers } from "./gl/buffers";
import type { FrameBuffer } from "./gl/framebuffer";
import type { ShaderPrograms } from "./gl/shaders";
import type { Texture } from "./gl/textures";
import type { Uniform, Uniforms } from "./gl/uniforms";

type StageOutput = {
    name: string;
    textures: Texture[];
    framebuffer: FrameBuffer;
}

type BufferedStageOutput = StageOutput[];


type Resources = {
    buffers: Buffers;
    output?: StageOutput | BufferedStageOutput;
    shaders: ShaderPrograms;
    uniforms?: Uniforms;
}

type Stage = {
    name: string;
    resources: Resources;
    input: Stage | null;
    targets: Texture[];
    parameters: Uniform[];
}

export type { Stage, StageOutput, BufferedStageOutput, Resources };