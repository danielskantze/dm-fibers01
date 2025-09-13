#version 300 es
precision highp float;
precision highp int;

in vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform sampler2D updated_tex;
uniform int u_frame;
uniform float u_time;

void main() {
    vec4 color = texture(tex, v_texcoord);
    vec4 updated = texture(updated_tex, v_texcoord);
    
    float i = max(0.0, 1.0 - (u_time - updated.x) / 5.0);
    float a = mix(1.0, color.a, i);
    out_color = vec4(color.rgb, 1.0) * vec4(i, i, i, 1.0);
}