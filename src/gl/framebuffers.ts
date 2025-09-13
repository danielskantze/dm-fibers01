import { WebGLFrameBufferError, WebGLInvalidIndexError } from "../types/error";
import type { FrameBuffer, MultisamplerFrameBuffer } from "../types/gl/framebuffer";
import type { RenderBuffer } from "../types/gl/renderbuffer";
import type { Texture } from "../types/gl/textures";

// It is probaly safe to just add the index to COLOR_ATTACHMENT0, 
// but I have not been able to validate this in the spec so we do it this way instead

function getFramebufferAttachment(gl: WebGL2RenderingContext, index: number): number {
    switch (index) {
        case 0:
            return gl.COLOR_ATTACHMENT0;
        case 1:
            return gl.COLOR_ATTACHMENT1;
        case 2:
            return gl.COLOR_ATTACHMENT2;
        case 3:
            return gl.COLOR_ATTACHMENT3;
        case 4:
            return gl.COLOR_ATTACHMENT4;
        case 5:
            return gl.COLOR_ATTACHMENT5;
        case 6:
            return gl.COLOR_ATTACHMENT6;
        case 7:
            return gl.COLOR_ATTACHMENT7;
        default:
            throw new WebGLInvalidIndexError(`Invalid index: ${index}`);
    }
}

function createFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number, textures: Texture[]): FrameBuffer {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (textures.length === 1) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[0].texture, 0);
    } else {
        for (let i = 0; i < textures.length; i++) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, getFramebufferAttachment(gl, i), gl.TEXTURE_2D, textures[i].texture, 0);
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new WebGLFrameBufferError(`Unable to create frame buffer: ${status}`);
    }
    return {
        width,
        height,
        framebuffer,
        textures,
    }
}

function createMultisamplerFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number, renderbuffer: RenderBuffer): MultisamplerFrameBuffer {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, renderbuffer.buffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
        width,
        height,
        framebuffer,
        renderbuffer,
    };
}

export { createFrameBuffer, getFramebufferAttachment, createMultisamplerFrameBuffer };