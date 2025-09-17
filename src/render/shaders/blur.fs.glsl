#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform vec2 texture_size;
out vec4 out_color;
uniform sampler2D tex;
uniform vec2 direction;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  vec4 c = texture(image, uv);
  color += c * c.a * 0.2270270270;
  c = texture(image, uv + (off1 / resolution));
  color += c * c.a * 0.3162162162;
  c = texture(image, uv - (off1 / resolution));
  color += c * c.a * 0.3162162162;
  c = texture(image, uv + (off2 / resolution));
  color += c * c.a * 0.0702702703;
  c = texture(image, uv - (off2 / resolution));
  color += c * c.a * 0.0702702703;
  return vec4(color.rgb, 1.0);
}

void main() {
    out_color = blur9(tex, v_texcoord, texture_size, direction);
}