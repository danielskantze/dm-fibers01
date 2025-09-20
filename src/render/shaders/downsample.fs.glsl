#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform vec2 u_source_resolution;

void main() {
    vec2 texel_size = 1.0 / u_source_resolution;

    // Offset by half a texel to sample between 4 texels with bilinear filtering.
    // This gives us a higher quality 4x4 box filter for a very low cost.
    vec2 offset = texel_size * 0.5;

    vec4 a = texture(tex, v_texcoord + vec2(-offset.x, -offset.y));
    vec4 b = texture(tex, v_texcoord + vec2( offset.x, -offset.y));
    vec4 c = texture(tex, v_texcoord + vec2(-offset.x,  offset.y));
    vec4 d = texture(tex, v_texcoord + vec2( offset.x,  offset.y));

    out_color = (a + b + c + d) * 0.25;
}
