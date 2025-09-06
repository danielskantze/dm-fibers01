#version 300 es
precision highp int;
precision highp float;
#define PI 3.1415926535897932384626433832795
#define PI2 6.283185307179586476925286766559
//in your particle update fragment shader

uniform ivec2 u_particles_texture_size;
uniform vec2 u_screen_size;
uniform float u_time;
uniform int u_frame;

uniform vec4 u_stroke_noise_p;
uniform vec4 u_stroke_drift_p;
uniform vec4 u_color_noise_p;

uniform vec3 u_cos_palette_1;
uniform vec3 u_cos_palette_2;
uniform vec3 u_cos_palette_3;
uniform vec3 u_cos_palette_4;

uniform sampler2D u_position_texture;
uniform sampler2D u_color_texture;
uniform sampler2D u_properties_texture;

layout(location = 0) out vec4 out_position; 
layout(location = 1) out vec4 out_color;
layout(location = 2) out vec4 out_properties;


const uint k = 1103515245U;  // GLIB C


float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash21(float p)
{
	vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec2 hash22(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.xx+p3.yz)*p3.zy);

}

vec3 hash33( vec3 p )      // this hash is not production ready, please
{                        // replace this by something better
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}


//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ------------------------------------------------------------
// Noise
// ------------------------------------------------------------

float gnoise( in vec3 x )
{
    // grid
    vec3 i = floor(x);
    vec3 f = fract(x);
    
    // quintic interpolant
    vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    
    // gradients
    vec3 ga = hash33( i+vec3(0.0,0.0,0.0) );
    vec3 gb = hash33( i+vec3(1.0,0.0,0.0) );
    vec3 gc = hash33( i+vec3(0.0,1.0,0.0) );
    vec3 gd = hash33( i+vec3(1.0,1.0,0.0) );
    vec3 ge = hash33( i+vec3(0.0,0.0,1.0) );
    vec3 gf = hash33( i+vec3(1.0,0.0,1.0) );
    vec3 gg = hash33( i+vec3(0.0,1.0,1.0) );
    vec3 gh = hash33( i+vec3(1.0,1.0,1.0) );
    
    // projections
    float va = dot( ga, f-vec3(0.0,0.0,0.0) );
    float vb = dot( gb, f-vec3(1.0,0.0,0.0) );
    float vc = dot( gc, f-vec3(0.0,1.0,0.0) );
    float vd = dot( gd, f-vec3(1.0,1.0,0.0) );
    float ve = dot( ge, f-vec3(0.0,0.0,1.0) );
    float vf = dot( gf, f-vec3(1.0,0.0,1.0) );
    float vg = dot( gg, f-vec3(0.0,1.0,1.0) );
    float vh = dot( gh, f-vec3(1.0,1.0,1.0) );
	
    // interpolation
    return va + 
           u.x*(vb-va) + 
           u.y*(vc-va) + 
           u.z*(ve-va) + 
           u.x*u.y*(va-vb-vc+vd) + 
           u.y*u.z*(va-vc-ve+vg) + 
           u.z*u.x*(va-vb-ve+vf) + 
           u.x*u.y*u.z*(-va+vb+vc-vd+ve-vf-vg+vh);
}

float fbm(vec2 x)
{    
    float H = 0.71;
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    for( int i=0; i < 5; i++ )
    {
        t += a*snoise(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

// ------------------------------------------------------------
// Palette
// ------------------------------------------------------------

vec3 cosPalette(  float t,  vec3 a,  vec3 b,  vec3 c, vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );
}

float sinBounce(float x) {
  float p = 0.5 * (sin(2.0 * PI * x - PI * 0.5) + 1.0);
  return p;
}

float angleAt_old(vec2 coord) {
  //vec2 scale = vec2(1.25, .33);
  float bt = sinBounce(u_time);
  float scaleFactor = 0.9 + .1 * bt; //0.2;
  float driftFactor = .3 + .1 * bt; //0.1;
  vec2 scale = vec2(1.25, .33) * scaleFactor;
  vec2 drift = driftFactor * 0.1 * vec2(
    snoise(vec2(u_time * 0.1)),
    snoise(vec2(u_time * 0.1 + 1.3))
  );
  vec2 p = vec2(coord + drift) * scale;
  return snoise(p + 0.1 *vec2(
    fbm(p + drift),
    fbm(p + drift + vec2(5.2 + 0.1 * bt))
  ));
}

float angleAt(vec2 coord) {
  //vec2 scale = vec2(1.25, .33);
  float bt = sinBounce(u_time);
  float scaleFactor = u_stroke_noise_p.x + u_stroke_noise_p.y * bt; //0.2;
  float driftFactor = u_stroke_drift_p.x + u_stroke_drift_p.y * bt; //0.1;
  vec2 scale = vec2(u_stroke_noise_p.z, u_stroke_noise_p.w) * scaleFactor;
  vec2 drift = driftFactor * vec2(
    snoise(vec2(u_time * u_stroke_drift_p.z)),
    snoise(vec2(u_time * u_stroke_drift_p.w + 1.3))
  );
  vec2 p = vec2(coord + drift) * scale;
  return gnoise(vec3(
    fbm(p),
    fbm(p + vec2(5.2 + 0.01 * bt)),
    u_time * 0.11
  ));
}

vec3 palette1(float t) {
  return cosPalette(t,
    u_cos_palette_1,
    u_cos_palette_2,
    u_cos_palette_3,
    u_cos_palette_4
  );
}

vec3 palette2(float t) {
  return vec3(.9, 0.9, 0.9);
}

vec4 colorAt(vec2 coord) {
  float cscale = u_color_noise_p.x + u_color_noise_p.y * sinBounce(u_time); 
  float drift = u_time * u_color_noise_p.z;
  float px = drift + cscale * coord.x;
  float py = drift + cscale * coord.y;
  //float alpha = fbm(vec2(px + 49.9 * 2.0, py + 29.5 * 1.9));
  float alpha = hash12(vec2(px, py));
  return vec4(
    palette1(gnoise(vec3(
      vec2(px, py),
      u_time * u_color_noise_p.w
    ))),
    alpha * 0.1
  );
}

bool boundsCheck(vec2 position) {
  return position.x > -1.0 && position.x < 1.0 && position.y > -1.0 && position.y < 1.0;
}

void main() {
    vec2 textureSize = vec2(u_particles_texture_size);
    vec2 coord = gl_FragCoord.xy / textureSize;
    float radius = 3.5;
    vec4 position;
    vec4 color;
    vec4 properties;

    if (u_frame > 0) {
      properties = texelFetch(u_properties_texture, ivec2(gl_FragCoord.xy), 0);
      position = texelFetch(u_position_texture, ivec2(gl_FragCoord.xy), 0);
      color = texelFetch(u_color_texture, ivec2(gl_FragCoord.xy), 0);
    }

    // position need to provide coordinates in clip space (-1.0 to 1.0)
    if (u_frame == 0 || properties.z > properties.w || !boundsCheck(position.xy)) {
      // new particle
      float lifetime = (hash12(coord) * 512.0 + 512.0) * 10.0;
      float age = 0.0;
      properties = vec4(
        radius * hash12(coord + vec2(u_time, 0.0)),
        0.0,
        age, 
        lifetime
      );
      position = vec4(
        hash22(100.0 * coord) * 2.0 - 1.0, 
        0, 
        1.0);
    } else {
      // existing particle
      float angle = angleAt(position.xy);
      vec2 step = vec2(cos(angle * PI2), sin(angle * PI2)) / u_screen_size.x;
      float p = clamp(properties.z / properties.w, 0.0, 1.0);
      float t = sinBounce(p);

      color = colorAt(coord);
      color.a = mix(color.a, color.a * 0.1, t);
      position.xy = position.xy + step * max(1.0, properties.y * .25);
      properties.y = properties.x * t; // radius
      properties.z = properties.z + max(1.0, properties.y * .25); // age
    }


    // Write the new data to the corresponding output variables
    out_position = position;
    out_color = color;
    out_properties = properties;
}