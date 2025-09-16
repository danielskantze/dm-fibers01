#version 300 es
precision highp float;
precision highp int;

in int a_index;

uniform ivec2 u_particles_texture_size;

// Textures storing particle state
uniform sampler2D u_position_texture;
uniform sampler2D u_color_texture;
uniform sampler2D u_properties_texture;

// geometry texture 
// - vec4 position (x, y)

// color texture
// - vec4 color (r, g, b, a)

// properties texture
// - float speed
// - float radius
// - float age
// - float lifetime

out vec4 position;
out vec4 color;
out float speed;
out float radius;
out float age;
out float lifetime;

void main() {
    ivec2 texel = ivec2(
        a_index % u_particles_texture_size.x,
        a_index / u_particles_texture_size.x
    );
    vec4 properties = texelFetch(u_properties_texture, texel, 0);
    
    position = texelFetch(u_position_texture, texel, 0);
    color = texelFetch(u_color_texture, texel, 0);

    speed = properties.x;
    radius = properties.y;
    age = properties.z;
    lifetime = properties.w;
    gl_Position = position;
    gl_PointSize = radius;
}