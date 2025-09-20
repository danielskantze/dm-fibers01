#version 300 es
precision mediump float;
precision highp int;

out vec4 out_color;
in highp vec2 v_texcoord;

uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform float intensity1;
uniform float intensity2;

void main() {
  vec4 texel1 = texture(texture_1, v_texcoord);
  vec4 texel2 = texture(texture_2, v_texcoord);
  
  // Convention: Apply the alpha channel from the first texture.
  vec3 color1 = texel1.rgb * texel1.a;
  vec3 color2 = texel2.rgb;

  // Additive blending is physically correct for combining light in an HDR pipeline.
  // The result will be correctly mapped to the display range by the filmic tonemapper.
  vec3 finalColor = color1 * intensity1 + color2 * intensity2;

  out_color = vec4(finalColor, 1.0);
}