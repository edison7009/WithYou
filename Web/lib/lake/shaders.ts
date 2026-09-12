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
uniform highp sampler3D uCloudNoise;
varying vec3 vWorld;
float cloudDensity(vec3 p) {
  float height = (p.y - 80.0) / 48.0;
  float profile = smoothstep(0.0, .23, height) * (1.0 - smoothstep(.5, 1.0, height));
  vec3 uv = p * .0016 + vec3(.37, .2, .63) + vec3(uTime * .000035, 0., uTime * .000014);
  float shape = texture(uCloudNoise, uv).r;
  float detail = texture(uCloudNoise, uv * 3.03).r;
  return max(0., shape * .85 + detail * .15 - .565) * 6.0 * profile;
}
void main() {
  vec3 dir = normalize(vWorld - cameraPosition);
  float h = max(dir.y, 0.0);
  vec3 horizon = vec3(1.15, .67, .29);
  vec3 zenith = vec3(.27, .45, .58);
  vec3 col = mix(horizon, zenith, pow(clamp(h * 1.25, 0., 1.), .45));
  float sunDist = distance(dir,uSun);
  col += vec3(1.5, .83, .31) * exp(-sunDist * 5.0);
  col += vec3(5.0, 3.8, 1.8) * exp(-sunDist * 46.0);
  col += vec3(8., 6., 3.) * (1.0 - smoothstep(.014, .018, sunDist));
  if (dir.y > .025) {
    float start = max(0., (80.0 - cameraPosition.y) / dir.y);
    float end = min(2400., (128.0 - cameraPosition.y) / dir.y);
    float stepSize = max(0., end - start) / 24.0;
    vec3 accumulated = vec3(0.);
    float transmittance = 1.;
    for (int i = 0; i < 24; i++) {
      vec3 p = cameraPosition + dir * (start + (float(i) + .5) * stepSize);
      float density = cloudDensity(p);
      if (density > .01) {
        float shade = exp(-cloudDensity(p + uSun * 24.0) * 2.3);
        vec3 lighting = mix(vec3(.46, .33, .22), vec3(1.8, 1.05, .43), shade);
        lighting += vec3(.6, .37, .13) * pow(max(dot(dir, uSun), 0.), 9.0);
        float opacity = 1.0 - exp(-density * stepSize * .11);
        accumulated += lighting * opacity * transmittance;
        transmittance *= 1.0 - opacity;
      }
    }
    col = col * transmittance + accumulated;
  }
  col = mix(horizon, col, smoothstep(-.08, .035, dir.y));
  gl_FragColor = vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const waterFragment = `
uniform sampler2D mirrorSampler;
uniform sampler2D normalSampler;
uniform sampler2D uRefraction;
uniform sampler2D uDepth;
uniform vec2 uResolution;
uniform float uNear;
uniform float uFar;
uniform float time;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform vec3 eye;
varying vec4 mirrorCoord;
varying vec4 worldPosition;
#include <common>
#include <packing>
#include <fog_pars_fragment>
void main() {
  vec2 p = worldPosition.xz;
  vec2 a = texture2D(normalSampler, p * .037 + vec2(time * .008, time * .002)).xy * 2. - 1.;
  vec2 b = texture2D(normalSampler, p * .081 + vec2(-time * .006, time * .005)).xy * 2. - 1.;
  vec2 c = texture2D(normalSampler, p * .17 + vec2(time * .004, -time * .007)).xy * 2. - 1.;
  float distant = smoothstep(35., 190., distance(eye, worldPosition.xyz));
  vec2 ripples = a * .24 + b * .13 + c * mix(.055, .008, distant);
  ripples += vec2(sin(p.x * .72 + p.y * 1.3 - time * 1.1), cos(p.y * .85 - p.x * .34 - time * .8)) * .035;
  vec3 normal = normalize(vec3(ripples.x, 1., ripples.y));
  vec3 view = normalize(eye - worldPosition.xyz);
  float fresnel = .025 + .975 * pow(1. - max(dot(view, normal), 0.), 5.);
  vec2 uv = gl_FragCoord.xy / uResolution;
  float waterZ = perspectiveDepthToViewZ(gl_FragCoord.z, uNear, uFar);
  float bedZ = perspectiveDepthToViewZ(texture2D(uDepth, uv).r, uNear, uFar);
  float thickness = max(0., waterZ - bedZ);
  vec2 refractedUV = clamp(uv + ripples * .028 * min(thickness * .25, 1.), .001, .999);
  float warpedZ = perspectiveDepthToViewZ(texture2D(uDepth, refractedUV).r, uNear, uFar);
  if (warpedZ > waterZ) refractedUV = uv;
  vec3 bed = texture2D(uRefraction, refractedUV).rgb;
  vec3 transmission = exp(-vec3(.28, .10, .072) * thickness);
  vec3 body = bed * transmission + vec3(.035, .20, .19) * (1. - transmission);
  vec2 reflectionUV = mirrorCoord.xy / mirrorCoord.w;
  reflectionUV += ripples * (.008 + .07 / max(distance(eye, worldPosition.xyz), 1.));
  vec3 reflection = texture2D(mirrorSampler, clamp(reflectionUV, .002, .998)).rgb;
  float glint = max(dot(reflect(-sunDirection, normal), view), 0.);
  vec3 sparkle = sunColor * (pow(glint, 240.) * 4.5 + pow(glint, 38.) * .18);
  vec3 color = mix(body, reflection, fresnel) + sparkle;
  gl_FragColor = vec4(color, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
