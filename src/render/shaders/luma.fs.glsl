#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform float u_threshold;

#define USE_LUMA 0

void main() {
    out_color = texture(tex, v_texcoord);
    vec3 c = out_color.rgb * out_color.a;
    #if USE_LUMA
    float t = dot(c, vec3(0.2126, 0.7152, 0.0722));
    #else
    float t = max(max(c.r, c.g), c.b);
    #endif
    float p = smoothstep(0.0, 1.0, (t - u_threshold) / (1.0 - u_threshold));
    out_color.rgb = mix(vec3(0.0), c, p);
    out_color.a = 1.0;
}