import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Avatar } from './avatar';
import { createLandscape, createSky, groundHeight } from './landscape';
import { createGrass, createVegetation } from './vegetation';
import { createWater } from './water';
import { random } from './noise';
import { companions, type LakeSettings } from './types';
export { shoreline, groundHeight } from './landscape';

export type LakeWorld = ReturnType<typeof createLakeWorld>;

export function createLakeWorld(container: HTMLElement, labels: Map<string, HTMLElement>, initial: LakeSettings, onReady: () => void, onError: (message: string) => void) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#c9ccb4', .0017);
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 1300);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, initial.lowPower ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label', '可拖动环顾的三维湖景：黄昏湖面、草岸和五位演示角色');
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.enablePan = false;
  controls.rotateSpeed = .35;
  controls.zoomSpeed = .55;
  controls.minDistance = 20;
  controls.maxDistance = 58;
  controls.minPolarAngle = Math.PI * .39;
  controls.maxPolarAngle = Math.PI * .497;
  controls.minAzimuthAngle = -.5;
  controls.maxAzimuthAngle = .55;
  const resetCamera = () => {
    controls.target.set(-14, .1, -28);
    camera.position.set(10, 4.2, 13);
    controls.update();
  };
  resetCamera();

  const sun = new THREE.Vector3(-.62, .17, -1).normalize();
  const time = { value: 0 };
  createSky(scene, sun, time);
  scene.add(new THREE.HemisphereLight('#d9eaff', '#667a35', 1.25));
  const sunlight = new THREE.DirectionalLight('#ffe0a4', 3.4);
  sunlight.position.copy(sun).multiplyScalar(100);
  sunlight.target.position.set(0, 0, 0);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -43, right: 43, top: 29, bottom: -29, near: .5, far: 220 });
  sunlight.shadow.bias = -.0002;
  sunlight.shadow.normalBias = .028;
  sunlight.shadow.radius = 2;
  scene.add(sunlight, sunlight.target);
  createLandscape(scene, time);
  const grassMesh = createGrass(scene, time, sun);
  if (initial.lowPower) grassMesh.count = 55000;
  createVegetation(scene, time, sun);
  const lake = createWater(scene, sun, grassMesh);
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
  let frame = 0, last = 0, lastTick = 0, elapsed = 0, lastLabel = 0;
  let disposed = false, ready = false, contextLost = false;
  let sampleStart = 0, sampleFrames = 0;
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
    const pixels = renderer.getDrawingBufferSize(new THREE.Vector2());
    lake.resize(pixels.x, pixels.y);
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
    const interval = settings.lowPower ? 1000 / 30 : 1000 / 60;
    if (now - lastTick < interval - .5) return;
    const dt = last ? Math.min((now - last) / 1000, .1) : 1 / 60;
    lastTick = now - ((now - lastTick) % interval);
    last = now;
    elapsed += dt;
    time.value = elapsed;
    controls.update();
    camera.position.y = Math.max(camera.position.y, .7, groundHeight(camera.position.x, camera.position.z) + 1.1);
    camera.lookAt(controls.target);
    lake.water.material.uniforms.time.value = elapsed;
    for (const avatar of avatars) {
      const self = avatar.data.id === 'you';
      avatar.root.visible = self || settings.companions;
      if (avatar.root.visible) avatar.update(self ? settings.pose : avatar.data.pose, self ? settings.agentBusy : avatar.data.busy, elapsed, dt);
    }
    birdGroup.position.x = -27 + (elapsed * .65) % 90;
    birds.forEach((bird, i) => { bird.scale.y = .45 + Math.sin(elapsed * 2.8 + i * .7) * .3; });
    particles.position.x = Math.sin(elapsed * .12) * .5;
    particles.position.y = Math.sin(elapsed * .4) * .1;
    renderer.info.reset();
    lake.captureBed(renderer, camera);
    renderer.render(scene, camera);
    if (!sampleStart) sampleStart = now;
    sampleFrames++;
    if (now - sampleStart > 2000) {
      renderer.domElement.dataset.fps = (sampleFrames * 1000 / (now - sampleStart)).toFixed(1);
      renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
      renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
      sampleStart = now;
      sampleFrames = 0;
    }
    if (now - lastLabel > 60) { updateLabels(); lastLabel = now; }
    if (!ready && !contextLost) { ready = true; onReady(); }
  }

  const onVisibility = () => {
    cancelAnimationFrame(frame);
    last = lastTick = sampleStart = 0;
    sampleFrames = 0;
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
        grassMesh.count = next.lowPower ? 55000 : 110000;
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
      const textures = new Set<THREE.Texture>();
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
      lake.dispose();
      sunlight.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
