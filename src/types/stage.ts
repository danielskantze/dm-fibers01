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

export type MultiSampleAntiAlias = {
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
    currentOutput?: StageOutput; // FIXME: This is a hack to expose the current output/framebuffer. We should probably expose the framebuffer instead of the texture at the stage target instead. That would make it easier to support renderbuffers too for efficiency
    multisampler?: MultiSampleAntiAlias;
    shaders: ShaderPrograms;
    uniforms?: Uniforms;
}

export interface TypedResources<T> extends Resources {
  internal: T
}

export type StageName = "accumulate" | "simulate" | "blur" | "materialize" | "output" | "luma" | "combine";

type Stage<T = {}> = {
    name: StageName;
    resources: Resources | TypedResources<T>;
    input: Stage | null;
    targets: Texture[]; // see currentOutput FIXNME
    parameters: Record<string, Uniform>;
}

export type { Stage, Resources, StageOutput, BufferedStageOutput, Buffers };