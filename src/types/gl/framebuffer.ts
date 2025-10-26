import type { RenderBuffer } from "./renderbuffer";
import type { Texture } from "./textures";

type FrameBuffer = {
  width: number;
  height: number;
  framebuffer: WebGLFramebuffer;
  textures: Texture[];
};

type MultisamplerFrameBuffer = {
  width: number;
  height: number;
  framebuffer: WebGLFramebuffer;
  renderbuffer: RenderBuffer;
};

type FrameBuffers = Record<string, FrameBuffer>;

export type { FrameBuffers, FrameBuffer, MultisamplerFrameBuffer };
