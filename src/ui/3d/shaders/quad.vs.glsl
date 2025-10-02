#version 300 es
precision highp float;

in vec4 position;

out vec2 v_texcoord;

void main() {
    gl_Position = position;

    // we know position is a clip space quad from -1 to +1
    v_texcoord = position.xy * 0.5 + 0.5;
}