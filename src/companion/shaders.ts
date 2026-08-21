/**
 * SOENA's body is written in shader language, not modelled in a DCC tool.
 *
 * LISA renders a designed 3D character; SOENA is a different kind of being:
 * a procedural "living light" — an icosphere breathed into shape by
 * simplex-noise FBM in the vertex stage, dressed by a fresnel-lit fragment
 * stage, ringed by an orbiting particle halo. Because the geometry and
 * "textures" are computed, the entire 3D presence costs 0 bytes of asset
 * downloads — the strongest optimization available to a 3D site.
 */

/** Ashima/IQ 3D simplex noise, the standard public-domain implementation. */
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

export const ORB_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmp;      // turbulence amplitude (mood)
uniform float uTempo;    // noise travel speed (mood)
uniform float uPulse;    // decaying spoken-word pulse
varying vec3 vNormal;
varying vec3 vView;
varying float vRipple;
${SIMPLEX}

float fbm(vec3 p) {
  float f = 0.0;
  f += 0.5333 * snoise(p);
  f += 0.2667 * snoise(p * 2.02);
  f += 0.1333 * snoise(p * 4.05);
  return f;
}

// Radial bump for a direction on the unit sphere:
// slow travelling FBM = the breath; a faster shallow band = the voice.
float bump(vec3 dir, float t) {
  float breath = fbm(dir * 1.15 + vec3(0.0, t * 0.35, t * 0.22));
  float speech = snoise(dir * 5.0 + vec3(t * 1.8, 0.0, 0.0)) * uPulse * 0.12;
  return breath * uAmp + speech;
}

void main() {
  vec3 n = normalize(position);
  float t = uTime * uTempo;

  float b0 = bump(n, t);
  vec3 pos = n * (1.0 + b0);

  // True displaced normals via tangent-plane gradient sampling — this is
  // what makes the surface read as liquid light instead of a lumpy ball.
  vec3 t1 = normalize(abs(n.y) < 0.99 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0)));
  vec3 t2 = normalize(cross(n, t1));
  float e = 0.08;
  vec3 n1 = normalize(n + t1 * e);
  vec3 n2 = normalize(n + t2 * e);
  vec3 p1 = n1 * (1.0 + bump(n1, t));
  vec3 p2 = n2 * (1.0 + bump(n2, t));
  vec3 N = normalize(cross(p1 - pos, p2 - pos));
  if (dot(N, n) < 0.0) N = -N;

  vRipple = b0 / max(uAmp, 0.001) * 0.5;
  vNormal = normalMatrix * N;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const ORB_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uPulse;
uniform float uEnergy;   // overall luminance (mood)
varying vec3 vNormal;
varying vec3 vView;
varying float vRipple;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fresnel = pow(1.0 - abs(dot(N, V)), 2.2);

  // A soft key light from above keeps the sphere reading as a volume.
  float lambert = dot(N, normalize(vec3(0.35, 0.75, 0.55))) * 0.5 + 0.5;

  // Body: dusk core lifting toward the avenue hue along the ripple crests.
  vec3 body = mix(uColorA * 0.6, uColorB, smoothstep(-0.45, 0.7, vRipple));
  body *= (0.45 + 0.55 * lambert) * (0.65 + uEnergy * 0.85);
  // Rim: the companion's edge burns with the avenue's second hue.
  vec3 rim = mix(uColorB, vec3(1.0), 0.4) * fresnel * (1.5 + uPulse * 1.1);

  vec3 col = body + rim;
  // Filmic-ish rolloff keeps the additive stack from clipping to white.
  col = col / (0.85 + col);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const GLOW_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GLOW_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColorB;
uniform float uPulse;
uniform float uEnergy;
varying vec2 vUv;
void main() {
  float d = length(vUv);
  float halo = exp(-d * d * 3.2) * (0.32 + uEnergy * 0.25 + uPulse * 0.22);
  // A faint ring — the door SOENA stands in. (Reversed-edge smoothstep is
  // undefined in GLSL, so both ramps are written in 1.0-minus form.)
  float ring = (1.0 - smoothstep(0.0, 0.02, abs(d - 0.82))) * 0.10;
  // Fade to nothing before the quad's edge so the plane never shows.
  float fade = 1.0 - smoothstep(0.55, 0.98, max(abs(vUv.x), abs(vUv.y)));
  vec3 col = uColorB * (halo + ring) * fade;
  // Blue-noise-ish dither kills 8-bit banding in the dark gradient.
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dither - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const HALO_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uTempo;
uniform float uPixelRatio;
attribute float aSeed;
varying float vTwinkle;
void main() {
  // Each mote orbits the companion on its own tilted ring.
  float angle = uTime * uTempo * (0.12 + fract(aSeed * 7.31) * 0.25) + aSeed * 6.2831;
  float c = cos(angle), s = sin(angle);
  vec3 p = position;
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);

  vTwinkle = 0.5 + 0.5 * sin(uTime * (1.2 + fract(aSeed * 3.7) * 2.0) + aSeed * 40.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.4 + fract(aSeed * 13.7) * 2.8) * uPixelRatio * (7.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const HALO_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColorB;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  if (d > 1.0) discard;
  float a = exp(-d * 3.0) * (0.25 + vTwinkle * 0.75);
  gl_FragColor = vec4(uColorB, a * 0.85);
}
`;
