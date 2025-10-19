#version 300 es
precision mediump float;

uniform int u_frame;

in vec4 color;

layout (location = 0) out vec4 out_color;
layout (location = 1) out int out_last_changed;

void main() {
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist < 0.5) {
    float a = smoothstep(1.0, 0.0, max(0.0, dist - 0.49));
        //out_color = vec4(color.rgb, color.a * a);
    out_color = vec4(color.rgb, color.a * a);
    out_last_changed = u_frame;
  } else {
    discard;
  }
}