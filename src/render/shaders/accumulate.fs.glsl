#version 300 es
precision highp float;

uniform vec2 u_screen_size;

in vec4 position;
in vec4 color;
in float speed;
in float radius;
in float age;
in float lifetime;

out vec4 out_color;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist < 0.5) {
        float a = smoothstep(1.0, 0.0, max(0.0, dist - 0.49));
        out_color = vec4(color.xyz, color.a * a);
    } else {
        discard;
    }
}