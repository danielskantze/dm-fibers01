#version 300 es
precision highp float;

in vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;

void main() {
    out_color = texture(tex, v_texcoord);
}