type TextureType = "RGB" | "RGBA" | "RGBA32F" | "R32F";

type Texture = {
    name: string;
    width: number;
    height: number;
    type: TextureType;
    texture: WebGLTexture;
}

type Textures = Record<string, Texture>;

export type { Textures, Texture, TextureType };