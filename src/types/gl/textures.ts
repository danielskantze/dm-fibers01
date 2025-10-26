type TextureType = "RGB" | "RGBA" | "RGBA32F" | "R32F" | "RGBA16F" | "R32I";

type Texture = {
  name: string;
  width: number;
  height: number;
  type: TextureType;
  texture: WebGLTexture;
};

type Textures = Record<string, Texture>;

export type { Textures, Texture, TextureType };
