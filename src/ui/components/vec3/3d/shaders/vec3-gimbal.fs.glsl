#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
uniform float u_time;
uniform mat4 u_object_mat;
uniform mat4 u_object_mat_i;
uniform float u_magnitude;

out vec4 out_color;
const float PI = 3.14159265357989f;
const float NORMAL_DELTA = 0.01f;

const vec3 Y_AXIS = vec3(0.0f, 1.0, 0.0f);

struct Axes3D {
  vec3 aa;
  vec3 bb;
  vec3 cc;
};

struct Light {
  vec3 pos;
  vec3 color;
  float a;
  vec3 kd;
  vec3 ks;
  float shininess;
};

struct RaycastResult {
  float d;
  vec3 p;
  int id;
};

struct MapResult {
  float d;
  vec3 p;
  int id;
};

const int kMaxIterations = 40;
const float kPixel = 0.001f;

const int kIdNone = -1;
const int kIdCylinder = 1;
const int kIdCone = 2;

Axes3D calcCameraAxes(vec3 pos, vec3 lookAt) {
  Axes3D c;
  c.aa = normalize(lookAt - pos);
  c.bb = normalize(cross(c.aa, Y_AXIS));
  c.cc = normalize(cross(c.bb, c.aa));
  return c;
}

vec3 calcRayDirection(vec2 p, Axes3D cam, float zoom) {
  return normalize(p.x * cam.bb +
    p.y * cam.cc +
    zoom * cam.aa);
}

Light light0(vec3 eye) {
  //mat4 rot = rotM_Z(0.25 * PI) * rotM_X(-0.25 * PI);
  vec3 p = vec3(-2.0, 5.0, -10.0);

  return Light(
    p,//(rot * vec4(eye, 1.0)).xyz,
    vec3(1.0, 1.0, 1.0), 
    0.1,
    vec3(0.85), 
    vec3(0.25), 
    0.9);
}

float sdCappedCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

float sdCone( vec3 p, vec2 c, float h )
{
  // c is the sin/cos of the angle, h is height
  // Alternatively pass q instead of (c,h),
  // which is the point at the base in 2D
  vec2 q = h*vec2(c.x/c.y,-1.0);
    
  vec2 w = vec2( length(p.xz), p.y );
  vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign( q.y );
  float d = min(dot( a, a ),dot(b, b));
  float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );
  return sqrt(d)*sign(s);
}

vec3 fresnel(vec3 F0, vec3 h, vec3 l) {
  return F0 + (1.0f - F0) * pow(clamp(1.0f - dot(h, l), 0.0f, 1.0f), 5.0f);
}

vec3 light(vec3 pos, vec3 dir, vec3 normal, Light light) {
  vec3 final = light.color * light.a;
  vec3 ref = reflect(dir, normal);
  vec3 vl = normalize(light.pos - pos);

  vec3 diffuse = light.kd * vec3(max(0.0f, dot(vl, normal)));
  vec3 specular = vec3(max(0.0f, dot(vl, ref)));

  vec3 F = fresnel(light.ks, normalize(vl - dir), vl);
  specular = pow(specular, vec3(light.shininess));

  final += light.color * mix(diffuse, specular, F);
  return final;
}

float s_cylinder(vec3 p, mat4 transform) {
  float offset_y = 0.8125 * u_magnitude;
  vec3 offset = vec3(0.0, offset_y, 0.0);
  vec4 lp = vec4(p - offset, 1.0);// * transform;
  return sdCappedCylinder(lp.xyz, 1.0 * u_magnitude, 0.125 * u_magnitude);
}

float s_cone(vec3 p, mat4 transform) {
  float offset_y = 0.8125;
  vec3 offset = vec3(0.0, (offset_y + 1.25) * u_magnitude, 0.0);
  float a = PI * 0.167;
  vec4 lp = vec4(p - offset, 1.0);// * transform;
  return sdCone(lp.xyz, vec2(sin(a), cos(a)), 0.75 * u_magnitude);
}

MapResult map(vec3 p, mat4 transform) {
  p = (transform * vec4(p, 1.0)).xyz;
  float cy_d = s_cylinder(p, transform);
  float co_d = s_cone(p, transform);
  float min_d = min(cy_d, co_d);
  if(co_d == min_d) {
    return MapResult(min_d, p, kIdCone);
  }
  return MapResult(min_d, p, kIdCylinder);
}

vec3 normal(vec3 p, int id, mat4 t, mat4 ti) {
  p = (t * vec4(p, 1.0)).xyz;
  const mat3 ep = mat3(NORMAL_DELTA, 0.f, 0.f, 0.f, NORMAL_DELTA, 0.f, 0.f, 0.f, NORMAL_DELTA);
  mat3 p1 = mat3(p, p, p) + ep;
  mat3 p2 = mat3(p, p, p) - ep;
  vec3 delta = vec3(0.f);

  if(id == kIdCylinder) {
    delta = vec3(
      s_cylinder(p1[0], t) - s_cylinder(p2[0], t), 
      s_cylinder(p1[1], t) - s_cylinder(p2[1], t), 
      s_cylinder(p1[2], t) - s_cylinder(p2[2], t));
  } else {
    delta = vec3(
      s_cone(p1[0], t) - s_cone(p2[0], t), 
      s_cone(p1[1], t) - s_cone(p2[1], t), 
      s_cone(p1[2], t) - s_cone(p2[2], t)
    );
  }
  return normalize((ti * vec4(delta, 0.0)).xyz);
}

RaycastResult raycast(vec3 ro, vec3 rd, float tmin, float tmax, mat4 transform) {
  RaycastResult result = RaycastResult(-1.0f, vec3(0.0f), -1);
  float t = tmin;
  for(int i = 0; i < kMaxIterations && t < tmax; i++) {
    vec3 p = ro + t * rd;

    MapResult mapR = map(p, transform);
    if(mapR.d < t * kPixel) {
      result.d = t;
      result.p = mapR.p;
      result.id = mapR.id;
      break;
    }
    t += mapR.d;
  }
  return result;
}

const float kZMax = 20.0;

void main() {
  vec2 uv = v_texcoord;
  // v_textcoord is 0-1 range, let's get it back to -1 - 1 range
  vec2 p = (v_texcoord - vec2(0.5f)) * 2.0f;

  mat4 xlat = u_object_mat; //rotM_X(PI * -0.3 * u_time);
  mat4 xlatI = u_object_mat_i; //inverse(xlat);

  vec3 ro = vec3(0.0f, 0.1f, -10.0f);
  vec3 lookAt = vec3(0.0f, 0.0f, 0.0f);
  Axes3D cameraAxes = calcCameraAxes(ro, lookAt);

  vec3 rd = calcRayDirection(p, cameraAxes, 4.0f);
  vec3 color = vec3(1.0, 0.85, 0.5);

  // Need to add raymarching here!
  RaycastResult rcRes = raycast(ro, rd, -0.0f, kZMax, xlatI);
  if(rcRes.d > 0.0f) {
    vec3 p = ro + rd * rcRes.d;
    color = color * light(
      p, 
      rd,
    normal(p, rcRes.id, xlatI, xlat), 
    light0(ro)
    );
    //float fog = 1.0 - (rcRes.d - 8.0) / (kZMax * .5); // fade out slightly when pointing away, just to give even more visual direction queues
    //fog = clamp(0.75 - fog * fog * fog, 0.0, 1.0);
    //color = mix(color, vec3(0.0), fog);
    out_color = vec4(color, 1.0f);
  } else {
    //out_color = vec4(0.0, 0.0, 0.0, 1.0);
    discard;
  }
}