#version 300 es
precision mediump float;

mat4 rotM_X(float a) {
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, cos(a), -sin(a), 0.0,
    0.0, sin(a), cos(a), 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

mat4 rotM_Y(float a) {
  return mat4(
    cos(a), 0.0, sin(a), 0.0,
    0.0f, 1.0, 0., -sin(a), 0.0,
    0.f, cos(a), 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

mat4 rotM_Z(float a) {
  return mat4(
    cos(a), -sin(a), 0.0, 0.0,
    sin(a), cos(a), 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
  0.0, 0.0, 0.0, 1.0
  );
}

mat4 scaleM(float s) {
  return mat4(
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1.0
  );
}