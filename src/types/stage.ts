import type { Buffers } from "./gl/buffers";
import type { FrameBuffer, MultisamplerFrameBuffer } from "./gl/framebuffer";
import type { RenderBuffer } from "./gl/renderbuffer";
import type { ShaderPrograms } from "./gl/shaders";
import type { Texture } from "./gl/textures";
import type { Uniform, Uniforms } from "./gl/uniforms";

type StageOutput = {
    name: string;
    textures: Texture[];
    framebuffer: FrameBuffer;
}

type BufferedStageOutput = StageOutput[];

type MultiSampleAntiAlias = {
    samples: number;
    internalformat: GLenum;
    width: number;
    height: number;
    renderbuffer: RenderBuffer;
    framebuffer: MultisamplerFrameBuffer;
}


type Resources = {
    buffers: Buffers;
    output?: StageOutput | BufferedStageOutput;
    multisampler?: MultiSampleAntiAlias;
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

export type { Stage, StageOutput, BufferedStageOutput, Resources, MultiSampleAntiAlias };