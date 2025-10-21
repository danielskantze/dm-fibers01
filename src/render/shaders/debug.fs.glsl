#version 300 es
precision mediump float;
#define PI2 6.283185307179586476925286766559

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform mat4x3 u_cos_palette;

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(PI2 * (c * t + d));
}

vec3 palette1(float t) {
  return cosPalette(t, u_cos_palette[0], u_cos_palette[1], u_cos_palette[2], u_cos_palette[3]);
}

void main() {
    //out_color = texture(tex, v_texcoord);
    out_color.rgb = palette1(v_texcoord.x);
    //int c = min(2, int(v_texcoord.x * 3.0));
    //int r = min(3, int((1.0 - v_texcoord.y) * 4.0));
    //vec3 v = u_cos_palette[r];
    
    //vec4 out_c = vec4(0.0, 0.0, 0.0, 1.0); 
    //out_c[0] = v[c];
    //out_c[1] = v[c];
    //out_c[2] = v[c];
    //out_color = out_c;
    out_color.a = 1.0f;
}