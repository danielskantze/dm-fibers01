#version 300 es
precision highp float;

in vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;

void main() {
    vec4 color = texture(tex, v_texcoord);
    out_color = color.rgba;
}