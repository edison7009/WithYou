import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Avatar } from './avatar';
import { skyFragment, skyVertex } from './shaders';
import { companions, type LakeSettings } from './types';

function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function shoreline(x: number) {
  return -.9 + Math.sin(x * .095) * 2.2 + Math.cos(x * .24) * .48;
}

export function groundHeight(x: number, z: number) {
  const depth = z - shoreline(x);
  return depth < 0 ? -.1 + depth * .16 : .12 + Math.min(depth * .22, .88) + Math.sin(x * .21 + z * .16) * .1 * Math.min(depth, 1);
}

function terrain(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(180, 100, 160, 85);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, 42);
  const vertices = geometry.attributes.position;
  const colors = [];
  const dark = new THREE.Color('#455b32');
  const light = new THREE.Color('#81904d');
  const sand = new THREE.Color('#b0a077');
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    vertices.setY(i, groundHeight(x, z));
    const n = (Math.sin(x * .47 + z * .32) + Math.cos(z * .81 - x * .19) + 2) * .25;
    const c = dark.clone().lerp(light, n).lerp(sand, 1 - THREE.MathUtils.smoothstep(z - shoreline(x), 0, 1.5));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function mountains(scene: THREE.Scene) {
  const rand = random(244);
  const palette = ['#afa49b', '#8a8f8a', '#687d77', '#486762'];
  for (let layer = 0; layer < 4; layer++) {
    const z = -205 + layer * 36;
    const positions: number[] = [], colors: number[] = [];
    const base = new THREE.Color(palette[layer]);
    const heights = Array.from({ length: 73 }, (_, i) => 10 + Math.sin(i * .3 + layer * 2) * 5 + Math.sin(i * .71) * 4 + rand() * 8 + (layer === 0 ? 5 : 0));
    for (let i = 0; i < 72; i++) {
      const x = (i - 36) * 6;
      positions.push(x, -.6, z, x + 6, -.6, z, x, heights[i], z, x + 6, -.6, z, x + 6, heights[i + 1], z, x, heights[i], z);
      for (let j = 0; j < 6; j++) {
        const c = base.clone().multiplyScalar(j % 3 === 2 ? 1.05 : .92);
        colors.push(c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: true })));
  }
  const forest = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5), new THREE.MeshStandardMaterial({ color: '#365750', roughness: 1 }), 210);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 210; i++) {
    const h = 2 + rand() * 4;
    dummy.position.set((i - 105) * 1.7, h * .5, -86 - rand() * 8);
    dummy.scale.set(.7 + rand() * .6, h, .7 + rand() * .6);
    dummy.updateMatrix();
    forest.setMatrixAt(i, dummy.matrix);
  }
  scene.add(forest);
}

function grass(scene: THREE.Scene, time: { value: number }) {
  const rand = random(916);
  const geometry = new THREE.PlaneGeometry(.065, .62, 1, 3);
  geometry.translate(0, .31, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setX(i, position.getX(i) * (1 - position.getY(i) / .65));
  const material = new THREE.MeshStandardMaterial({ color: '#869852', roughness: 1, side: THREE.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.uniforms.uWindTime = time;
    shader.vertexShader = 'uniform float uWindTime; varying float vBladeHeight;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vBladeHeight = position.y / .62;
      vec4 bladeWorld = instanceMatrix * vec4(position, 1.0);
      transformed.x += sin(uWindTime * 1.1 + bladeWorld.x * .42 + bladeWorld.z * .31) * pow(position.y, 2.0) * .45;
      transformed.z += cos(uWindTime * .8 + bladeWorld.x * .25) * pow(position.y, 2.0) * .22;
    `);
    shader.fragmentShader = 'varying float vBladeHeight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(.56, 1.18, vBladeHeight);');
  };
  const count = 24000;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  let placed = 0;
  while (placed < count) {
    const x = (rand() - .5) * 100;
    const z = rand() * 45 - 3;
    if (z - shoreline(x) < .8) continue;
    if (companions.some(c => Math.hypot(x - c.x, z - c.z) < 1.15)) continue;
    dummy.position.set(x, groundHeight(x, z) - .02, z);
    dummy.rotation.y = rand() * Math.PI;
    const scale = .55 + rand() * .95;
    dummy.scale.set(scale, scale * (.65 + rand() * .55), scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    mesh.setColorAt(placed, new THREE.Color().setHSL(.17 + rand() * .045, .28 + rand() * .15, .35 + rand() * .17));
    placed++;
  }
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return mesh;
}

function details(scene: THREE.Scene) {
  const rand = random(773);
  const dummy = new THREE.Object3D();
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#7a8171', roughness: 1, flatShading: true }), 95);
  for (let i = 0; i < 95; i++) {
    const x = (rand() - .5) * 110, z = shoreline(x) + rand() * 2 - 1;
    const s = .08 + Math.pow(rand(), 3) * .85;
    dummy.position.set(x, groundHeight(x, z) + s * .16, z);
    dummy.scale.set(s * 1.4, s * .7, s);
    dummy.rotation.set(rand(), rand(), rand());
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  scene.add(rocks);

  // A few flowers punctuate the near bank without filling the open lake view.
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.065, 0), new THREE.MeshStandardMaterial({ color: '#f2d697', roughness: 1 }), 190);
  for (let i = 0; i < 190; i++) {
    const x = (rand() - .5) * 65, z = 7 + rand() * 20;
    dummy.position.set(x, groundHeight(x, z) + .35 + rand() * .2, z);
    dummy.scale.set(1, .55, 1);
    dummy.rotation.set(0, rand(), 0);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    flowers.setColorAt(i, new THREE.Color(i % 4 ? '#efd997' : '#bca3bf'));
  }
  scene.add(flowers);

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#62543f', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#53734a', roughness: 1, flatShading: true });
  const leafGeometry = new THREE.IcosahedronGeometry(1, 1);
  for (const [x, z, scale] of [[-22, 9, 1.3], [24, 13, 1.5], [-32, 4, 1], [39, 7, 1.1]]) {
    const tree = new THREE.Group();
    tree.position.set(x, groundHeight(x, z), z);
    tree.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .35, 5, 8), trunkMat);
    trunk.position.y = 2.5;
    trunk.rotation.z = .05;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let i = 0; i < 9; i++) {
      const crown = new THREE.Mesh(leafGeometry, leafMat);
      crown.position.set((rand() - .5) * 4.5, 4.5 + rand() * 2, (rand() - .5) * 3);
      crown.scale.set(1.6 + rand(), 1 + rand(), 1.4 + rand());
      crown.castShadow = true;
      tree.add(crown);
    }
    scene.add(tree);
  }
}

function createWater(scene: THREE.Scene, sun: THREE.Vector3) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
      const nx = Math.sin(u * 4 + v * 3) * .23 + Math.sin(u * 11 - v * 7) * .08;
      const ny = Math.cos(u * 3 - v * 5) * .23 + Math.sin(u * 7 + v * 13) * .08;
      const i = (y * size + x) * 4;
      data[i] = Math.round((nx * .5 + .5) * 255);
      data[i + 1] = Math.round((ny * .5 + .5) * 255);
      data[i + 2] = Math.round(Math.sqrt(1 - nx * nx - ny * ny) * 255);
      data[i + 3] = 255;
    }
  }
  const normals = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
  normals.magFilter = normals.minFilter = THREE.LinearFilter;
  normals.needsUpdate = true;
  const water = new Water(new THREE.PlaneGeometry(650, 520), {
    textureWidth: 512, textureHeight: 512, waterNormals: normals,
    sunDirection: sun, sunColor: 0xffdf99, waterColor: 0x477d78,
    distortionScale: 1.8, alpha: 1, fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, .025, -205);
  water.material.uniforms.size.value = 3.8;
  scene.add(water);
  return { water, normals };
}

export type LakeWorld = ReturnType<typeof createLakeWorld>;

export function createLakeWorld(container: HTMLElement, labels: Map<string, HTMLElement>, initial: LakeSettings, onReady: () => void, onError: (message: string) => void) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#c6b99c', .0038);
  const camera = new THREE.PerspectiveCamera(47, 1, .1, 900);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label', '可拖动环顾的三维湖景：黄昏湖面、草岸和五位演示角色');
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.enablePan = false;
  controls.rotateSpeed = .35;
  controls.zoomSpeed = .55;
  controls.minDistance = 13;
  controls.maxDistance = 36;
  controls.minPolarAngle = Math.PI * .34;
  controls.maxPolarAngle = Math.PI * .49;
  controls.minAzimuthAngle = -.5;
  controls.maxAzimuthAngle = .55;
  const resetCamera = () => {
    controls.target.set(0, 2.4, -9);
    camera.position.set(7.5, 7.5, 20);
    controls.update();
  };
  resetCamera();

  const sun = new THREE.Vector3(-.37, .12, -1).normalize();
  const time = { value: 0 };
  const skyMaterial = new THREE.ShaderMaterial({ uniforms: { uTime: time, uSun: { value: sun } }, vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(440, 40, 20), skyMaterial));
  scene.add(new THREE.HemisphereLight('#e9e2c3', '#3d5244', 2.4));
  const sunlight = new THREE.DirectionalLight('#ffe1a3', 3.1);
  sunlight.position.copy(sun).multiplyScalar(65);
  sunlight.target.position.set(0, 0, 4);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -28, right: 28, top: 24, bottom: -24, near: .5, far: 130 });
  sunlight.shadow.bias = -.0005;
  sunlight.shadow.normalBias = .04;
  scene.add(sunlight, sunlight.target);
  terrain(scene);
  mountains(scene);
  const grassMesh = grass(scene, time);
  details(scene);
  const { water, normals } = createWater(scene, sun);
  const avatars = companions.map(c => new Avatar(c, groundHeight(c.x, c.z)));
  avatars.forEach(avatar => scene.add(avatar.root));

  const rand = random(27);
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(70 * 3);
  for (let i = 0; i < particlePositions.length; i += 3) {
    particlePositions[i] = (rand() - .5) * 42;
    particlePositions[i + 1] = 1.2 + rand() * 3.4;
    particlePositions[i + 2] = rand() * 19;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: '#ffe3a1', size: .045, transparent: true, opacity: .62, depthWrite: false }));
  scene.add(particles);

  const birdGroup = new THREE.Group();
  const wingGeometry = new THREE.BufferGeometry();
  wingGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -.5, .12, .1, -.8, .03, .12, 0, 0, 0, .5, .12, .1, .8, .03, .12], 3));
  const birdMat = new THREE.MeshBasicMaterial({ color: '#6e746b', side: THREE.DoubleSide });
  const birds: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const bird = new THREE.Mesh(wingGeometry, birdMat);
    bird.position.set(i * 2.6, Math.abs(i - 3) * .65, Math.abs(i - 3) * 1.7);
    bird.scale.setScalar(.65);
    birds.push(bird);
    birdGroup.add(bird);
  }
  birdGroup.position.set(-20, 14, -65);
  scene.add(birdGroup);

  let settings = initial;
  let frame = 0, last = 0, elapsed = 0, lastLabel = 0;
  let disposed = false, ready = false, contextLost = false;
  renderer.debug.onShaderError = (_gl, _program, _vertex, _fragment) => {
    contextLost = true;
    cancelAnimationFrame(frame);
    onError('当前设备未能完成湖景渲染，请更新浏览器后重试。');
  };
  const projection = new THREE.Vector3();
  let width = 1, height = 1;
  const resize = () => {
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function updateLabels() {
    for (const avatar of avatars) {
      const label = labels.get(avatar.data.id);
      if (!label) continue;
      projection.copy(avatar.labelPoint).project(camera);
      const show = avatar.root.visible && projection.z < 1 && Math.abs(projection.x) < .96 && Math.abs(projection.y) < .96;
      label.style.visibility = show ? 'visible' : 'hidden';
      if (show) label.style.transform = `translate(-50%, -100%) translate(${(projection.x * .5 + .5) * width}px, ${(-projection.y * .5 + .5) * height}px)`;
    }
  }

  function render(now: number) {
    if (disposed || document.hidden || contextLost) return;
    frame = requestAnimationFrame(render);
    const interval = settings.lowPower ? 1000 / 24 : 1000 / 40;
    if (now - last < interval) return;
    const dt = last ? Math.min((now - last) / 1000, .1) : 1 / 40;
    last = now;
    elapsed += dt;
    time.value = elapsed;
    controls.update();
    water.material.uniforms.time.value = elapsed * .22;
    for (const avatar of avatars) {
      const self = avatar.data.id === 'you';
      avatar.root.visible = self || settings.companions;
      if (avatar.root.visible) avatar.update(self ? settings.pose : avatar.data.pose, self ? settings.agentBusy : avatar.data.busy, elapsed, dt);
    }
    birdGroup.position.x = -27 + (elapsed * .65) % 90;
    birds.forEach((bird, i) => { bird.scale.y = .45 + Math.sin(elapsed * 2.8 + i * .7) * .3; });
    particles.position.x = Math.sin(elapsed * .12) * .5;
    particles.position.y = Math.sin(elapsed * .4) * .1;
    renderer.render(scene, camera);
    if (now - lastLabel > 60) { updateLabels(); lastLabel = now; }
    if (!ready && !contextLost) { ready = true; onReady(); }
  }

  const onVisibility = () => {
    cancelAnimationFrame(frame);
    last = 0;
    if (!document.hidden && !contextLost) frame = requestAnimationFrame(render);
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    onError('画面暂时中断，请重新加载湖景。');
  };
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  frame = requestAnimationFrame(render);

  return {
    resetCamera,
    update(next: LakeSettings) {
      if (next.lowPower !== settings.lowPower) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, next.lowPower ? 1 : 1.5));
        grassMesh.count = next.lowPower ? 12000 : 24000;
        resize();
      }
      settings = next;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      // Release scene resources and the context, including Water's private reflection target.
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>([normals]);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach(mat => {
            materials.add(mat);
            if (mat instanceof THREE.ShaderMaterial) {
              for (const uniform of Object.values(mat.uniforms)) if (uniform.value instanceof THREE.Texture) textures.add(uniform.value);
            }
          });
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => t.dispose());
      sunlight.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
