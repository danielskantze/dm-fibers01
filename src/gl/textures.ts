import type { Texture, TextureType } from "../types/gl/textures";

function getTextureInternalFormat(gl: WebGL2RenderingContext, type: TextureType): number {
    switch (type) {
        case "RGB":
            return gl.RGB;
        case "RGBA":
            return gl.RGBA;
        case "RGBA16F":
            return gl.RGBA16F;
        case "RGBA32F":
            return gl.RGBA32F;
        case "R32F":
          return gl.R32F;
    }
}

function getTextureFormat(gl: WebGL2RenderingContext, type: TextureType): number {
    switch (type) {
        case "RGB":
            return gl.RGB;
        case "RGBA":
        case "RGBA16F":
        case "RGBA32F":
            return gl.RGBA;
        case "R32F":
          return gl.RED;
    }
}

function getTextureDataType(gl: WebGL2RenderingContext, type: TextureType): number {
    switch (type) {
        case "RGB":
        case "RGBA":
            return gl.UNSIGNED_BYTE;
        case "RGBA16F":
            return gl.HALF_FLOAT;
        case "R32F":
        case "RGBA32F":
            return gl.FLOAT;
    }
}

function createTexture(gl: WebGL2RenderingContext, width: number, height: number, type: TextureType, name = "default", nearest = false): Texture {
    const tex: WebGLTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, getTextureInternalFormat(gl, type), width, height, 0, getTextureFormat(gl, type), getTextureDataType(gl, type), null);
    
    if (nearest) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
        // For bloom effect, we use manual mipmap generation with separate textures.
        // These textures are not "mipmap complete", so we must use NEAREST for the MIN_FILTER
        // to avoid the sampler returning black. LINEAR is correct for MAG_FILTER for smooth upsampling.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return {
        name,
        width,
        height,
        type,
        texture: tex
    }
}

function setTextureData(gl: WebGL2RenderingContext, texture: Texture, data: null | ArrayBufferView) {
    const { texture: tex, width, height, type } = texture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, getTextureFormat(gl, type), getTextureDataType(gl, type), data);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

export { createTexture, setTextureData };
