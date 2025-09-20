#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform float u_weight;
uniform vec2 u_source_resolution; // The size of the texture we are sampling from

// A 4-tap box filter for upsampling. It's a good balance between the
// low-quality single-tap bilinear filter and the expensive 9-tap filter.
vec4 upsample_4tap(sampler2D image, vec2 uv, vec2 resolution) {
    vec2 texelSize = 1.0 / resolution;
    vec2 halfTexel = texelSize * 0.5;
    
    vec4 c1 = texture(image, uv - halfTexel); // top-left
    vec4 c2 = texture(image, uv + halfTexel); // bottom-right
    vec4 c3 = texture(image, uv + vec2(halfTexel.x, -halfTexel.y)); // top-right
    vec4 c4 = texture(image, uv - vec2(halfTexel.x, -halfTexel.y)); // bottom-left

    return (c1 + c2 + c3 + c4) * 0.25;
}

void main() {
    vec4 upsampled_color = upsample_4tap(tex, v_texcoord, u_source_resolution);
    out_color = upsampled_color * u_weight;
}