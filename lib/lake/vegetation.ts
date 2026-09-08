import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { farShore, groundHeight, shoreline } from './landscape';
import { fbm, random } from './noise';
import { companions } from './types';

function windMaterial(color: string, time: { value: number }, sun: THREE.Vector3, kind: 'grass' | 'leaf' | 'fir') {
  const material = new THREE.MeshStandardMaterial({ color, roughness: .88, side: THREE.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.uniforms.uWindTime = time;
    shader.uniforms.uLeafSun = { value: sun };
    shader.vertexShader = `uniform float uWindTime; varying float vBlade; varying vec3 vPlantWorld;
      float windField(vec2 p) {
        return sin(dot(p,vec2(.13,.09))-uWindTime*.82)*.55
          + sin(dot(p,vec2(.41,.25))-uWindTime*1.3)*.25
          + sin(p.x*1.8+p.y*1.1-uWindTime*2.2)*.08;
      }\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vec3 root = instanceMatrix[3].xyz;
      vBlade = ${kind === 'grass' ? 'clamp(position.y / .7, 0., 1.)' : kind === 'fir' ? 'clamp(position.y / 8., 0., 1.)' : '1.'};
      float wind = .2 + windField(root.xz);
      vec2 direction = vec2(.94,.34);
      vec2 localWind = vec2(dot(direction, normalize(instanceMatrix[0].xz)), dot(direction, normalize(instanceMatrix[2].xz)));
      transformed.xz += localWind * wind * vBlade * vBlade * ${kind === 'grass' ? '.35' : kind === 'fir' ? '.38' : '.24'};
      ${kind === 'grass' ? 'transformed.y -= abs(wind) * vBlade * vBlade * .06;' : ''}
      vPlantWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
    `);
    if (kind === 'grass') {
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        objectNormal = normalize(vec3(normal.x, .65, normal.z * .55));
      `);
    }
    shader.fragmentShader = 'uniform vec3 uLeafSun; varying float vBlade; varying vec3 vPlantWorld;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      diffuseColor.rgb *= mix(${kind === 'grass' ? '.42, 1.22' : '.84, 1.08'}, vBlade);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float backlight = pow(max(dot(normalize(cameraPosition - vPlantWorld), -uLeafSun), 0.), 3.);
      outgoingLight += diffuseColor.rgb * vec3(1.0, .96, .48) * backlight * ${kind === 'grass' ? '.65' : '.38'} * mix(.2, 1., vBlade);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => `lakeside-wind-${kind}`;
  return material;
}

export function createGrass(scene: THREE.Scene, time: { value: number }, sun: THREE.Vector3) {
  const rand = random(916), dummy = new THREE.Object3D();
  const geometry = new THREE.PlaneGeometry(.052, .7, 1, 4);
  geometry.translate(0, .35, 0);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / .7;
    p.setX(i, p.getX(i) * (1 - t * .97) + t * t * .085);
    p.setZ(i, -.2 * t * t);
  }
  geometry.computeVertexNormals();
  const count = 110000;
  const grass = new THREE.InstancedMesh(geometry, windMaterial('#ffffff', time, sun, 'grass'), count);
  const tint = new THREE.Color();
  let placed = 0;
  while (placed < count) {
    // Nearby blades get the density; the distant meadow is carried by the terrain.
    const x = (rand() - .5) * 95, z = -12 + rand() * 50;
    const bank = z - shoreline(x);
    if (bank < .35 || (z < -1 && x > -14)) continue;
    if (companions.some(c => Math.hypot(x - c.x, z - c.z) < .95)) continue;
    const patch = fbm(x * .23, z * .23);
    if (rand() < .12 && patch < .38) continue;
    const scale = .65 + rand() * .7;
    dummy.position.set(x, groundHeight(x, z) - .018, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, (rand() - .5) * .12);
    dummy.scale.set(scale, scale * (.62 + patch * .65), scale);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    tint.setHSL(.18 + patch * .035, .57 + patch * .16, .46 + rand() * .1, THREE.SRGBColorSpace);
    grass.setColorAt(placed, tint);
    placed++;
  }
  grass.receiveShadow = true;
  grass.computeBoundingSphere();
  scene.add(grass);
  return grass;
}

export function createVegetation(scene: THREE.Scene, time: { value: number }, sun: THREE.Vector3) {
  const rand = random(773), dummy = new THREE.Object3D();
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);
  const rp = rockGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const scale = .88 + fbm(rp.getX(i) * 3, rp.getZ(i) * 3) * .22;
    rp.setXYZ(i, rp.getX(i) * scale, rp.getY(i) * scale, rp.getZ(i) * scale);
  }
  rockGeo.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: '#909183', roughness: .92 }), 165);
  for (let i = 0; i < rocks.count; i++) {
    const x = (rand() - .5) * 160, z = shoreline(x) + (rand() - .6) * 6;
    const s = .1 + Math.pow(rand(), 3) * .95;
    dummy.position.set(x, groundHeight(x, z) + s * .24, z);
    dummy.scale.set(s * 1.3, s * .68, s);
    dummy.rotation.set(rand(), rand() * 6, rand());
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, new THREE.Color().setHSL(.12, .055 + rand() * .07, .42 + rand() * .17));
  }
  rocks.castShadow = rocks.receiveShadow = true;
  rocks.layers.enable(2);
  scene.add(rocks);

  const firParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const crown = new THREE.ConeGeometry(1.75 * (1 - i / 10), 2.7 - i * .16, 11, 2);
    crown.translate(Math.sin(i * 3) * .1, 1.65 + i * .65, 0);
    firParts.push(crown);
  }
  const firGeometry = mergeGeometries(firParts);
  firParts.forEach(p => p.dispose());
  const firs = new THREE.InstancedMesh(firGeometry, windMaterial('#ffffff', time, sun, 'fir'), 570);
  for (let i = 0; i < firs.count; i++) {
    let x = (rand() - .5) * 370;
    let z = farShore(x) - 5 - rand() * 32;
    if (i < 150) { x = -47 - rand() * 55; z = shoreline(x) + 7 + rand() * 10; }
    const s = .55 + rand() * .95;
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(0, rand() * 6, (rand() - .5) * .06);
    dummy.scale.set(s, s * (.8 + rand() * .4), s);
    dummy.updateMatrix();
    firs.setMatrixAt(i, dummy.matrix);
    firs.setColorAt(i, new THREE.Color().setHSL(.24 + rand() * .025, .23 + rand() * .18, .19 + rand() * .12, THREE.SRGBColorSpace));
  }
  scene.add(firs);

  // Small rounded leaves build an irregular canopy instead of solid crown spheres.
  const leafGeometry = new THREE.SphereGeometry(1, 5, 3);
  leafGeometry.scale(.19, .042, .092);
  const leaves = new THREE.InstancedMesh(leafGeometry, windMaterial('#ffffff', time, sun, 'leaf'), 12800);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#76654a', roughness: .96 });
  const trees = [[-14, 0, 1.3], [28, 8, 1.2], [-36, -3, .9], [43, 3, 1.1]];
  let leafIndex = 0;
  for (const [x, z, scale] of trees) {
    const y = groundHeight(x, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.11, .34, 4.6 * scale, 9, 3), trunkMaterial);
    trunk.position.set(x, y + 2.3 * scale, z);
    trunk.rotation.z = -.05;
    trunk.castShadow = trunk.receiveShadow = true;
    scene.add(trunk);
    const crowns = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(x + Math.cos(i * 2.4) * 1.6 * scale, y + (4.5 + rand() * 1.5) * scale, z + Math.sin(i * 2.4) * 1.4 * scale));
    for (const crown of crowns) {
      const start = new THREE.Vector3(x, y + 3.1 * scale, z);
      const direction = crown.clone().sub(start);
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(.035, .12, direction.length(), 6), trunkMaterial);
      branch.position.copy(start).addScaledVector(direction, .5);
      branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      branch.castShadow = true;
      scene.add(branch);
      for (let i = 0; i < 400; i++) {
        const theta = rand() * Math.PI * 2, v = rand() * 2 - 1;
        const r = Math.pow(rand(), .24), spread = Math.sqrt(1 - v * v);
        dummy.position.copy(crown).add(new THREE.Vector3(Math.cos(theta) * spread * r * 1.65, v * r * 1.05, Math.sin(theta) * spread * r * 1.45).multiplyScalar(scale));
        dummy.rotation.set((rand() - .5) * 1.7, rand() * 6, (rand() - .5) * 1.6);
        dummy.scale.setScalar((.75 + rand() * .7) * scale);
        dummy.updateMatrix();
        leaves.setMatrixAt(leafIndex, dummy.matrix);
        leaves.setColorAt(leafIndex++, new THREE.Color().setHSL(.205 + rand() * .025, .47 + rand() * .18, .35 + rand() * .19, THREE.SRGBColorSpace));
      }
    }
  }
  leaves.castShadow = leaves.receiveShadow = true;
  scene.add(leaves);

  const petalParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.SphereGeometry(.04, 5, 3);
    petal.scale(1, .35, 1.7);
    petal.translate(0, .52, .04);
    petal.rotateY(i * Math.PI * .4);
    petalParts.push(petal);
  }
  const flowers = new THREE.InstancedMesh(mergeGeometries(petalParts), windMaterial('#ffffff', time, sun, 'grass'), 310);
  petalParts.forEach(p => p.dispose());
  for (let i = 0; i < flowers.count; i++) {
    const x = (rand() - .5) * 57, z = 5 + rand() * 20;
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.scale.setScalar(.6 + rand() * .6);
    dummy.rotation.set(0, rand() * 6, 0);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color(i % 5 ? '#fff4c5' : '#bbabdd'));
  }
  scene.add(flowers);
  return { leaves, flowers };
}
