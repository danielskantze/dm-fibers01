#version 300 es
precision highp float;

in vec4 position;
out vec4 v_color;

void main() {
    gl_Position = position;

    // we know position is a clip space quad from -1 to +1
    v_color = vec4(position.x * 0.5 + 0.5, 0, 0, 1);
}