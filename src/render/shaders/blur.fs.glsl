#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform vec2 texture_size;
out vec4 out_color;
uniform sampler2D tex;
uniform sampler2D previous_tex;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  vec4 c = texture(image, uv);
  c.rgb = c.rgb * c.a;
  color += c * 0.2270270270;
  
  c = texture(image, uv + (off1 / resolution));
  c.rgb = c.rgb * c.a;
  color += c * 0.3162162162;

  c = texture(image, uv - (off1 / resolution));
  c.rgb = c.rgb * c.a;
  color += c * 0.3162162162;

  c = texture(image, uv + (off2 / resolution));
  c.rgb = c.rgb * c.a;
  color += c * 0.0702702703;

  c = texture(image, uv - (off2 / resolution));
  c.rgb = c.rgb * c.a;
  color += c * 0.0702702703;

  return color;
}


void main() {
    mat3x4 r1;
    mat3x4 r2;
    mat3x4 r3;
    ivec2 pos = ivec2(gl_FragCoord.xy);
    out_color = texture(tex, v_texcoord);
    r1[0] = texelFetch(previous_tex, pos + ivec2(-1, -1), 0);
    r1[1] = texelFetch(previous_tex, pos + ivec2(0, -1), 0);
    r1[2] = texelFetch(previous_tex, pos + ivec2(1, -1), 0);

    r2[0] = texelFetch(previous_tex, pos + ivec2(-1, 0), 0);
    //r2[1] = 7.0 * texelFetch(previous_tex, pos + ivec2(0, 0), 0);
    r2[1] = 7.0 * out_color;
    r2[2] = texelFetch(previous_tex, pos + ivec2(1, 0), 0);

    r3[0] = texelFetch(previous_tex, pos + ivec2(-1, 1), 0);
    r3[1] = texelFetch(previous_tex, pos + ivec2(0, 1), 0);
    r3[2] = texelFetch(previous_tex, pos + ivec2(1, 1), 0);

    mat3x4 sum = r1 + r2 + r3;
    
    //out_color = out_color + 0.5 * (sum[0] + sum[1] + sum[2]) / 9.0;
    out_color = (sum[0] + sum[1] + sum[2]) / 12.0;
    //out_color *= 0.97;
}