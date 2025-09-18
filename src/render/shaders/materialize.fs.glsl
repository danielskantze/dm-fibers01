#version 300 es
precision mediump float;

uniform vec2 u_screen_size;
uniform int u_frame;
uniform float u_time;

in vec4 position;
in vec4 color;
in float speed;
in float radius;
in float age;
in float lifetime;

layout(location = 0) out vec4 out_color; 
layout(location = 1) out float out_last_changed;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist < 0.5) {
        float a = smoothstep(1.0, 0.0, max(0.0, dist - 0.49));
        //out_color = vec4(color.rgb, color.a * a);
        out_color = vec4(color.rgb, color.a * a);
        out_last_changed = u_time;
    } else {
        discard;
    }
}