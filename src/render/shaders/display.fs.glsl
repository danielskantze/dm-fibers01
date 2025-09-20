#version 300 es
precision mediump float;

in highp vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D tex;

// Filmic tonemapping curve from Uncharted 2 by John Hable
// http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 Uncharted2Tonemap(vec3 x) {
  float A = 0.15; // Shoulder Strength
  float B = 0.50; // Linear Strength
  float C = 0.10; // Linear Angle
  float D = 0.20; // Toe Strength
  float E = 0.02; // Toe Numerator
  float F = 0.30; // Toe Denominator
  return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

void main() {
    const float gamma = 2.2;
    const float exposure = 1.0;
    const float whitePoint = 1.0;

    vec4 color = texture(tex, v_texcoord);
    vec3 hdrColor = color.rgb * color.a;
  
    // Apply exposure
    hdrColor *= exposure;
    
    // Apply filmic tonemapping
    vec3 tonemappedColor = Uncharted2Tonemap(hdrColor);
    
    // Scale by white point and apply gamma correction
    vec3 finalColor = tonemappedColor / Uncharted2Tonemap(vec3(whitePoint));
    finalColor = pow(finalColor, vec3(1.0 / gamma));
  
    out_color.rgb = finalColor;
    out_color.a = 1.0;
}