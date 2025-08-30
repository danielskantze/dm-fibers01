import type { Texture } from "./textures";

type FrameBuffer = {
    width: number;
    height: number;
    framebuffer: WebGLFramebuffer;
    textures: Texture[];
}

type FrameBuffers = Record<string, FrameBuffer>;

export type { FrameBuffers, FrameBuffer };