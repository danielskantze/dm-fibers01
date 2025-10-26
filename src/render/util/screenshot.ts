import type { Texture } from "../../types/gl/textures";
import type { StageOutput } from "../../types/stage";

export function readTextureData(
  gl: WebGL2RenderingContext,
  texture: Texture
): Uint8Array {
  var framebuffer = gl.createFramebuffer();
  const { width, height } = texture;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture.texture,
    0
  );
  const data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.deleteFramebuffer(framebuffer);
  return data;
}

export function readOutputData(
  gl: WebGL2RenderingContext,
  output: StageOutput
): Uint8Array {
  var framebuffer = output.framebuffer.framebuffer;
  const { width, height } = output.framebuffer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    output.textures[0].texture,
    0
  );
  const data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return data;
}

export function getTexturePng(gl: WebGL2RenderingContext, output: StageOutput): string {
  // Create a 2D canvas to store the result
  var canvas = document.createElement("canvas");
  const { width, height } = output.framebuffer;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const textureData = readTextureData(gl, output.textures[0]!);

  // Copy the pixels to a 2D canvas
  var imageData = context!.createImageData(width, height);
  imageData.data.set(textureData);
  context!.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
