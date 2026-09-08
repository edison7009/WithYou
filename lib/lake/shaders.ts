export const skyVertex = `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

export const skyFragment = `
uniform float uTime;
uniform vec3 uSun;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) { return noise(p)*.56 + noise(p*2.03)*.28 + noise(p*4.09)*.14; }
void main() {
  vec3 dir = normalize(vWorld - cameraPosition);
  float h = max(dir.y, 0.0);
  vec3 horizon = vec3(.98,.71,.46);
  vec3 zenith = vec3(.31,.49,.56);
  vec3 col = mix(horizon, zenith, pow(clamp(h*1.8,0.0,1.0), .63));
  float sunDist = distance(dir,uSun);
  col += vec3(.5,.25,.08) * exp(-sunDist*4.5);
  col = mix(col, vec3(1.0,.94,.7), 1.0-smoothstep(.03,.036,sunDist));
  col += vec3(.22,.14,.055) * exp(-sunDist*29.0);
  if (dir.y > .025) {
    vec2 p = dir.xz / (dir.y + .19) * 2.3;
    p.x += uTime * .003;
    float n = fbm(p * vec2(.7,2.8));
    float cloud = smoothstep(.55,.73,n) * smoothstep(.025,.09,dir.y) * .65;
    vec3 cloudColor = mix(vec3(.83,.57,.44),vec3(1.,.85,.63),noise(p*3.0));
    col = mix(col,cloudColor,cloud);
    float wisps = smoothstep(.64,.81,fbm(p*vec2(.32,8.0)+5.0)) * .12;
    col += vec3(wisps);
  }
  col = mix(vec3(.7,.62,.46),col,smoothstep(-.15,.03,dir.y));
  gl_FragColor = vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
