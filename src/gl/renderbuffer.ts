import type { RenderBuffer } from "../types/gl/renderbuffer";

function createRenderBuffer(
  gl: WebGL2RenderingContext,
  samples: number,
  internalformat: GLenum,
  width: number,
  height: number
): RenderBuffer {
  const renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorageMultisample(
    gl.RENDERBUFFER,
    samples,
    internalformat,
    width,
    height
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return {
    width,
    height,
    buffer: renderbuffer,
  };
}

export { createRenderBuffer };
