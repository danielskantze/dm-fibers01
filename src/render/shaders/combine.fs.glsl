#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;

// The 5 downsampled and blurred layers
uniform sampler2D u_blur_layer_0; // Fullest resolution blur
uniform sampler2D u_blur_layer_1;
uniform sampler2D u_blur_layer_2;
uniform sampler2D u_blur_layer_3;
uniform sampler2D u_blur_layer_4; // Lowest resolution blur

// The independent weights for each layer
uniform float u_weights[5];

void main() {
    // Sample each layer and multiply by its independent weight
    vec4 color = vec4(0.0);
    color += texture(u_blur_layer_0, v_texcoord) * u_weights[0];
    color += texture(u_blur_layer_1, v_texcoord) * u_weights[1];
    color += texture(u_blur_layer_2, v_texcoord) * u_weights[2];
    color += texture(u_blur_layer_3, v_texcoord) * u_weights[3];
    color += texture(u_blur_layer_4, v_texcoord) * u_weights[4];
    
    out_color = color;
}