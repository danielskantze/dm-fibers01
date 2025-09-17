#version 300 es
precision highp float;
precision highp int;

in vec2 v_texcoord;
uniform sampler2D previous_color_tex;
uniform sampler2D previous_updated_tex;
uniform sampler2D stamp_color_tex;
uniform sampler2D stamp_updated_tex;
uniform int u_frame;
uniform float u_time;

layout(location = 0) out vec4 out_color;
layout(location = 1) out vec4 out_updated;

const float fade_time = 2.0;


void main() {
  vec4 p_color = texelFetch(previous_color_tex, ivec2(gl_FragCoord.xy), 0);
  vec4 p_updated = texelFetch(previous_updated_tex, ivec2(gl_FragCoord.xy), 0);
  vec4 color = texelFetch(stamp_color_tex, ivec2(gl_FragCoord.xy), 0);
  vec4 updated = texelFetch(stamp_updated_tex, ivec2(gl_FragCoord.xy), 0);

  float p_i = clamp(1.0 - (u_time - p_updated.x) / fade_time, 0.0, 1.0);
  p_i = smoothstep(0.0, 1.0, p_i);
  float c_i = u_time - updated.x;

  // - New + old particle: premultiply alpha to determine the tone, then replace the alpha with 1.0 and write to output texture. New updated timestamp is written to updated texture. 
  //- Old particles: alpha will correspond to the remaining life of that pixel, then write to output texture. Old updated timestamp is copied to updated texture. 

  out_color = c_i < 0.1 ? 
    p_color * vec4(1.0 - color.a) * p_i + vec4(color.rgb * color.a, 1.0) :
    p_color;
  out_color.a = p_i;
  out_updated = max(updated, p_updated);
}