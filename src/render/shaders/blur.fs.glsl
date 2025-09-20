#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
uniform vec2 texture_size;
out vec4 out_color;
uniform sampler2D tex;
uniform vec2 direction;

// Optimized 5-tap separable Gaussian blur that uses 3 texture fetches
// by leveraging linear texture filtering.
vec4 fastBlur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  // Pre-calculated weights and offsets for combining 5 taps into 3
  float w0 = 0.2270270270;
  float w1 = 0.3864864865;
  float off1 = 1.7199324324;

  vec2 off = vec2(off1) * direction;
  
  vec4 color = texture(image, uv) * w0;

  // Combined taps
  color += texture(image, uv + (off / resolution)) * w1;
  color += texture(image, uv - (off / resolution)) * w1;
  
  // Return the blurred RGB with a full alpha, ignoring the source alpha for a brighter bloom.
  return vec4(color.rgb, 1.0);
}

void main() {
    out_color = fastBlur(tex, v_texcoord, texture_size, direction);
}