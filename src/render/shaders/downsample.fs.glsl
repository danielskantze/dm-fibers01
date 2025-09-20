#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;
uniform vec2 u_source_resolution;

// A 5-tap cross filter for high-quality downsampling.
// This pre-filters the source texture to prevent temporal aliasing.
void main() {
    vec2 texelSize = 1.0 / u_source_resolution;
    vec4 result = vec4(0.0);
    
    // Center tap
    result += texture(tex, v_texcoord) * 0.25;
    
    // Cross taps
    result += texture(tex, v_texcoord + vec2(texelSize.x, 0.0)) * 0.1875;
    result += texture(tex, v_texcoord - vec2(texelSize.x, 0.0)) * 0.1875;
    result += texture(tex, v_texcoord + vec2(0.0, texelSize.y)) * 0.1875;
    result += texture(tex, v_texcoord - vec2(0.0, texelSize.y)) * 0.1875;

    out_color = result;
}
