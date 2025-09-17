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
    out_color = texelFetch(texture_1, loc, 0);
    if (num_textures > 1) {
      out_color += texelFetch(texture_2, loc, 0);
    }
    if (num_textures > 2) {
      out_color += texelFetch(texture_3, loc, 0);
    }
    if (num_textures > 3) {
      out_color += texelFetch(texture_4, loc, 0);
    }
    out_color /= float(num_textures);
    //out_color.rgb = out_color.rgb * out_color.a;
    out_color.a = 1.0;
}