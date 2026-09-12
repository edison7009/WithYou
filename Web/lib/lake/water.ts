import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { hash } from './noise';
import { waterFragment } from './shaders';

export function createWater(scene: THREE.Scene, sun: THREE.Vector3, grass: THREE.InstancedMesh) {
  const size = 256, heights = new Float32Array(size * size), data = new Uint8Array(size * size * 4);
  const sample = (x: number, y: number) => heights[((y + size) % size) * size + (x + size) % size];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let value = 0;
    for (let octave = 0; octave < 4; octave++) {
      const period = 8 * 2 ** octave;
      const u = x / size * period, v = y / size * period;
      const ix = Math.floor(u), iy = Math.floor(v);
      const fx = (u - ix) ** 2 * (3 - 2 * (u - ix));
      const fy = (v - iy) ** 2 * (3 - 2 * (v - iy));
      const a = hash(ix, iy), b = hash((ix + 1) % period, iy);
      const c = hash(ix, (iy + 1) % period), d = hash((ix + 1) % period, (iy + 1) % period);
      value += ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy) / 2 ** octave;
    }
    heights[y * size + x] = value;
  }
  const normal = new THREE.Vector3();
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    normal.set((sample(x - 1, y) - sample(x + 1, y)) * 6, (sample(x, y - 1) - sample(x, y + 1)) * 6, 1).normalize();
    const i = (y * size + x) * 4;
    data[i] = (normal.x * .5 + .5) * 255;
    data[i + 1] = (normal.y * .5 + .5) * 255;
    data[i + 2] = (normal.z * .5 + .5) * 255;
    data[i + 3] = 255;
  }
  const normals = new THREE.DataTexture(data, size, size);
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
  normals.magFilter = THREE.LinearFilter;
  normals.minFilter = THREE.LinearMipmapLinearFilter;
  normals.generateMipmaps = true;
  normals.needsUpdate = true;
  const water = new Water(new THREE.PlaneGeometry(680, 650, 220, 210), {
    textureWidth: 768, textureHeight: 768, waterNormals: normals,
    sunDirection: sun, sunColor: '#ffe3ab', fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, .015, -235);
  water.material.fragmentShader = waterFragment;
  water.material.vertexShader = water.material.vertexShader
    .replace('worldPosition = mirrorCoord.xyzw;', `
      float wave = sin(mirrorCoord.x * .48 + mirrorCoord.z * .72 - time * .7) * .017
        + sin(mirrorCoord.x * .93 - mirrorCoord.z * .34 - time * .95) * .009;
      mirrorCoord.y += wave;
      worldPosition = mirrorCoord.xyzw;
    `)
    .replace('vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );', 'vec4 mvPosition = viewMatrix * worldPosition;');
  const refraction = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  refraction.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  Object.assign(water.material.uniforms, {
    uRefraction: { value: refraction.texture }, uDepth: { value: refraction.depthTexture },
    uResolution: { value: new THREE.Vector2(1, 1) }, uNear: { value: .1 }, uFar: { value: 1300 },
  });
  const reflect = water.onBeforeRender.bind(water);
  water.onBeforeRender = (...args) => {
    // Subpixel foreground blades do not need a second full draw in the distant reflection.
    const visible = grass.visible;
    grass.visible = false;
    try { reflect(...args); } finally { grass.visible = visible; }
  };
  scene.add(water);
  return {
    water,
    resize(width: number, height: number) {
      refraction.setSize(Math.max(1, Math.floor(width * .75)), Math.max(1, Math.floor(height * .75)));
      water.material.uniforms.uResolution.value.set(width, height);
    },
    captureBed(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
      const mask = camera.layers.mask, target = renderer.getRenderTarget();
      const shadows = renderer.shadowMap.autoUpdate;
      camera.layers.set(2);
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(refraction);
      renderer.render(scene, camera);
      renderer.setRenderTarget(target);
      renderer.shadowMap.autoUpdate = shadows;
      camera.layers.mask = mask;
      water.material.uniforms.uNear.value = camera.near;
      water.material.uniforms.uFar.value = camera.far;
    },
    dispose() { refraction.dispose(); normals.dispose(); },
  };
}
