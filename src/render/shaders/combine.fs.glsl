#version 300 es
precision highp float;

uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform sampler2D texture_3;
uniform sampler2D texture_4;
uniform int num_textures;

in vec2 v_texcoord;
out vec4 out_color;

void main() {
    ivec2 loc = ivec2(gl_FragCoord.xy);
    vec4 c1 = texelFetch(texture_1, loc, 0);
    vec4 c2 = vec4(0.0);
    vec4 c3 = vec4(0.0);
    vec4 c4 = vec4(0.0);
    float nt = float(num_textures);
    if (num_textures > 1) {
      c2 = texelFetch(texture_2, loc, 0);
    }
    if (num_textures > 2) {
      c3 = texelFetch(texture_3, loc, 0);
    }
    if (num_textures > 3) {
      c4 = texelFetch(texture_4, loc, 0);
    }
    // Ideally we should give all equal weight or we use a uniform with weights. Currently we hardcode weights for stacked blur filters (experimental, works so-so)
    // out_color = 1.5 * (c1 * 0.25 + c2 * 0.5 + c3 * 0.75 + c4) / float(num_textures);
    out_color = (c1 + c2 + c3 + c4) / float(num_textures);
    out_color.a = 1.0;
}