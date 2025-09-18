#version 300 es
precision highp float;

in vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;

void main() {
    const float gamma = 2.2;
    const float exposure = 1.0;
    vec4 color = texture(tex, v_texcoord);
    vec3 hdrColor = color.rgb * color.a;
  
    // exposure tone mapping
    vec3 mapped = vec3(1.0) - exp(-hdrColor * exposure);
    // gamma correction 
    mapped = pow(mapped, vec3(1.0 / gamma));
  
    out_color.rgb = mapped;
    out_color.a = 1.0;
}