#version 300 es
precision mediump float;
precision highp int;
precision highp isampler2D;
#define FPS 60.0
in highp vec2 v_texcoord;
uniform sampler2D previous_color_tex;
uniform isampler2D previous_updated_tex;
uniform sampler2D stamp_color_tex;
uniform isampler2D stamp_updated_tex;
uniform int u_frame;
uniform float u_fade_time;

uniform int u_accumulate;

layout(location = 0) out vec4 out_color;
layout(location = 1) out int out_updated;

void main() {
  vec3 p_color = texelFetch(previous_color_tex, ivec2(gl_FragCoord.xy), 0).rgb;
  int p_updated = texelFetch(previous_updated_tex, ivec2(gl_FragCoord.xy), 0).r;
  vec4 color = texelFetch(stamp_color_tex, ivec2(gl_FragCoord.xy), 0);
  int updated = texelFetch(stamp_updated_tex, ivec2(gl_FragCoord.xy), 0).r;

  if (u_accumulate == 1) {
    float p_i = clamp(1.0 - float(u_frame - p_updated) / (FPS * u_fade_time), 0.0, 1.0);

    // Fade new partciles aggressively at first. Creates a more dynamic look where we get more contrasts. 
    p_i = p_i * p_i * p_i;
    bool isNew = (u_frame - updated) == 0;

    // State Strategy:
    // RGB = pure accumulated color.
    // Alpha = decay factor (remaining life), used for custom fading in a later pass.
    // This avoids a simple exponential feedback-loop fade.

    if (isNew) {
      // New particle: Blend with the DECAYED old trail (`p_color * p_i`) to
      // prevent the trail from unnaturally brightening. The result is the new
      // pure color, and its decay (alpha) is reset to 1.0.
      out_color = vec4(
        p_color * vec3(1.0 - color.a) * p_i + vec3(color.rgb * color.a), 
        1.0
      );
    } else {
      // Aging trail: Preserve the pure color and update the decay factor.
      out_color = vec4(p_color, p_i);
    }    
  } else {
    out_color = vec4(color.xyz, 1.0);
  }
  out_updated = max(updated, p_updated);
}