import * as THREE from 'three';
import { fbm, hash, noise, random } from './noise';
import { skyFragment, skyVertex } from './shaders';

export function shoreline(x: number) {
  return -1.5 + Math.sin(x * .075) * 1.8 + x * .095 - .012 * Math.min(x + 14, 0) ** 2;
}

export function farShore(x: number) {
  return -138 + Math.sin(x * .023) * 14 + Math.cos(x * .057) * 7;
}

export function groundHeight(x: number, z: number) {
  const d = Math.max(z - shoreline(x), farShore(x) - z);
  if (d < 0) return Math.max(-8, d * .145) + (fbm(x * .32, z * .32) - .5) * Math.min(-d * .13, .55);
  return d * .072 + fbm(x * .035, z * .035) * Math.min(d * .085, 2.8);
}

export function createLandscape(scene: THREE.Scene, time: { value: number }) {
  const geometry = new THREE.PlaneGeometry(320, 280, 320, 280);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -65);
  const vertices = geometry.attributes.position;
  const colors = [];
  const meadow = new THREE.Color('#809b38'), dark = new THREE.Color('#566f2d');
  const sand = new THREE.Color('#b5b07b'), submerged = new THREE.Color('#808c62');
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i), y = groundHeight(x, z);
    vertices.setY(i, y);
    const c = dark.clone().lerp(meadow, fbm(x * .14, z * .14));
    c.lerp(sand, 1 - THREE.MathUtils.smoothstep(y, .0, .26));
    if (y < 0) c.lerp(submerged, fbm(x * .6, z * .6) * .8);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 });
  material.onBeforeCompile = shader => {
    shader.uniforms.uLandTime = time;
    shader.vertexShader = 'varying vec3 vLand;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLand = position;');
    shader.fragmentShader = `varying vec3 vLand; uniform float uLandTime;
      float landHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float landNoise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(landHash(i),landHash(i+vec2(1,0)),f.x),mix(landHash(i+vec2(0,1)),landHash(i+1.),f.x),f.y); }
      \n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float detail = landNoise(vLand.xz * 5.) * .12 + landNoise(vLand.xz * 1.3) * .18;
      diffuseColor.rgb *= .86 + detail;
      float cloud = smoothstep(.52, .8, landNoise(vLand.xz * .014 + uLandTime * .002));
      diffuseColor.rgb *= 1. - cloud * .14;
      if (vLand.y < 0.) {
        float caustic = abs(sin(vLand.x * 3.1 + sin(vLand.z * 2.8 + uLandTime * .65)) + sin(vLand.z * 3.4 - uLandTime * .4));
        diffuseColor.rgb += vec3(.14, .16, .08) * pow(1. - smoothstep(0., .24, caustic), 2.) * exp(vLand.y * .55);
      }
    `);
  };
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  ground.layers.enable(2); // The refraction pass draws the bed and shoreline stones only.
  scene.add(ground);

  const rand = random(244);
  for (let layer = 0; layer < 3; layer++) {
    const mountain = new THREE.PlaneGeometry(920, 155, 180, 32);
    mountain.rotateX(-Math.PI / 2);
    mountain.translate(0, 0, -250 - layer * 120);
    const p = mountain.attributes.position;
    const peaks = Array.from({ length: 22 }, () => ({ x: (rand() - .5) * 930, z: -250 - layer * 120 + (rand() - .5) * 50, h: 16 + rand() * 51, w: 14 + rand() * 25 }));
    const colors = [];
    const tint = new THREE.Color(['#a5a995', '#b6b6a2', '#c6bfad'][layer]);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let height = 1;
      for (const peak of peaks) height = Math.max(height, peak.h * Math.exp(-Math.hypot(x - peak.x, (z - peak.z) * 1.4) / peak.w));
      height *= .78 + fbm(x * .11, z * .11) * .45;
      p.setY(i, height * (.34 + layer * .1) - 1);
      const c = tint.clone().multiplyScalar(.85 + noise(x * .07, z * .07) * .3);
      if (height > 36) c.lerp(new THREE.Color('#d7ceba'), THREE.MathUtils.smoothstep(height, 36, 65) * .6);
      colors.push(c.r, c.g, c.b);
    }
    mountain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mountain.computeVertexNormals();
    const mesh = new THREE.Mesh(mountain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    scene.add(mesh);
  }
}

export function createSky(scene: THREE.Scene, sun: THREE.Vector3, time: { value: number }) {
  const size = 48, data = new Uint8Array(size ** 3);
  // Tileable density volume: trilinear GPU samples keep the cloud march inexpensive.
  function volume(x: number, y: number, z: number, period: number) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const ease = (n: number) => n * n * (3 - 2 * n);
    const u = ease(x - ix), v = ease(y - iy), w = ease(z - iz);
    let result = 0;
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      result += hash((ix + dx) % period, (iy + dy) % period, (iz + dz) % period)
        * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    }
    return result;
  }
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const value = volume(x / size * 8, y / size * 8, z / size * 8, 8) * .7
      + volume(x / size * 16, y / size * 16, z / size * 16, 16) * .3;
    data[x + y * size + z * size * size] = Math.round(value * 255);
  }
  const density = new THREE.Data3DTexture(data, size, size, size);
  density.format = THREE.RedFormat;
  density.minFilter = density.magFilter = THREE.LinearFilter;
  density.wrapS = density.wrapT = density.wrapR = THREE.RepeatWrapping;
  density.unpackAlignment = 1;
  density.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uSun: { value: sun }, uCloudNoise: { value: density } },
    vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 20), material);
  scene.add(sky);
  return sky;
}
