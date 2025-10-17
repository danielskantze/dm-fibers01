// ------------------------------------------------------------
// --- UNUSED FUNCTIONS ---
// ------------------------------------------------------------
/*
vec2 hash21(float p)
{
  vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
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

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

vec3 palette2(float t) {
  return vec3(.9, 0.9, 0.9);
}
*/