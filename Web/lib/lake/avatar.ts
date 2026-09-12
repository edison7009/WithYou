import * as THREE from 'three';
import type { Companion, Pose } from './types';

const up = new THREE.Vector3(0, 1, 0);
const sphere = new THREE.SphereGeometry(1, 20, 14);
const limbGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
const temp = new THREE.Vector3();

type V3 = [number, number, number];
type BodyPose = { hip: V3; headTilt: number; lean: number; knees: V3[]; feet: V3[]; elbows: V3[]; hands: V3[] };

const poses: Record<Pose, BodyPose> = {
  sit: { hip: [0, .43, 0], headTilt: -.07, lean: -.04, knees: [[-.47, .2, -.28], [.47, .2, -.28]], feet: [[.2, .14, -.53], [-.2, .14, -.46]], elbows: [[-.38, .64, -.12], [.38, .64, -.12]], hands: [[-.43, .36, -.32], [.43, .36, -.32]] },
  read: { hip: [0, .43, 0], headTilt: .18, lean: .08, knees: [[-.47, .2, -.28], [.47, .2, -.28]], feet: [[.2, .14, -.53], [-.2, .14, -.46]], elbows: [[-.34, .65, -.18], [.34, .65, -.18]], hands: [[-.2, .67, -.48], [.2, .67, -.48]] },
  lie: { hip: [0, .24, 0], headTilt: -.2, lean: -1.27, knees: [[-.2, .18, -.63], [.27, .42, -.57]], feet: [[-.2, .14, -1.22], [.25, .15, -1.07]], elbows: [[-.45, .3, .57], [.46, .3, .57]], hands: [[-.24, .29, .88], [.24, .29, .88]] },
  stretch: { hip: [0, 1.05, 0], headTilt: -.18, lean: -.07, knees: [[-.21, .6, 0], [.21, .6, 0]], feet: [[-.27, .12, -.02], [.27, .12, -.02]], elbows: [[-.38, 1.98, .03], [.38, 1.98, .03]], hands: [[-.18, 2.37, .04], [.18, 2.37, .04]] },
};

function material(color: THREE.ColorRepresentation, roughness = .9) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function ellipsoid(parent: THREE.Object3D, mat: THREE.Material, position: V3, scale: V3) {
  const mesh = new THREE.Mesh(sphere, mat);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function segment(parent: THREE.Object3D, mat: THREE.Material, radius: number) {
  const mesh = new THREE.Mesh(limbGeometry, mat);
  mesh.castShadow = true;
  mesh.userData.radius = radius;
  parent.add(mesh);
  return mesh;
}

function placeSegment(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  temp.subVectors(b, a);
  mesh.position.copy(a).addScaledVector(temp, .5);
  mesh.scale.set(mesh.userData.radius, temp.length(), mesh.userData.radius);
  mesh.quaternion.setFromUnitVectors(up, temp.normalize());
}

export class Avatar {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  readonly labelPoint = new THREE.Vector3();
  readonly lamp = new THREE.Group();
  private readonly lampMaterial: THREE.MeshStandardMaterial;
  private readonly lampGlow: THREE.Mesh;
  private readonly book = new THREE.Group();
  private readonly arms: THREE.Mesh[] = [];
  private readonly legs: THREE.Mesh[] = [];
  private readonly hands: THREE.Mesh[] = [];
  private readonly shoes: THREE.Mesh[] = [];
  private readonly elbowCaps: THREE.Mesh[] = [];
  private readonly kneeCaps: THREE.Mesh[] = [];
  private readonly joints = Array.from({ length: 8 }, () => new THREE.Vector3());
  private currentHip = new THREE.Vector3();
  private lean = 0;
  private initialized = false;

  constructor(readonly data: Companion, ground: number) {
    this.root.position.set(data.x, ground, data.z);
    const skin = material('#d5a37c');
    const hair = material(data.id === 'mika' ? '#583728' : '#3b3028');
    const shirt = material(data.color);
    const trousers = material('#35434c');
    const sole = material('#e7d9ba');
    const dark = material('#293734');
    const matColor = new THREE.Color(data.color).multiplyScalar(.66);
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(.79, .83, .1, 48), material(matColor));
    mat.scale.z = .85;
    mat.position.y = .08;
    mat.receiveShadow = true;
    this.root.add(mat, this.body);

    ellipsoid(this.body, shirt, [0, .32, 0], [.33, .4, .23]);
    ellipsoid(this.body, shirt, [0, .59, 0], [.34, .19, .24]);
    // Hood and a small seam make the rear silhouette readable from the lake camera.
    ellipsoid(this.body, shirt, [0, .62, .19], [.22, .16, .1]);
    this.head.position.set(0, .86, -.005);
    this.body.add(this.head);
    ellipsoid(this.head, skin, [0, 0, 0], [.26, .3, .245]);
    ellipsoid(this.head, hair, [0, .13, .045], [.276, .215, .25]);
    ellipsoid(this.head, hair, [0, .035, .2], [.255, .23, .075]);
    ellipsoid(this.head, skin, [-.25, -.015, 0], [.055, .075, .045]);
    ellipsoid(this.head, skin, [.25, -.015, 0], [.055, .075, .045]);
    ellipsoid(this.head, skin, [0, -.045, -.243], [.045, .055, .045]);
    ellipsoid(this.head, dark, [-.09, .015, -.225], [.018, .018, .012]);
    ellipsoid(this.head, dark, [.09, .015, -.225], [.018, .018, .012]);
    if (data.id === 'you' || data.id === 'yuki') {
      const hat = material(data.id === 'you' ? '#e6bd70' : '#e2d4bd');
      ellipsoid(this.head, hat, [0, .24, .02], [.3, .18, .27]);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.27, .043, 8, 28), hat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = .17;
      this.head.add(rim);
      ellipsoid(this.head, hat, [0, .4, .02], [.07, .06, .07]);
    }
    for (let side = 0; side < 2; side++) {
      this.arms.push(segment(this.root, shirt, .12), segment(this.root, shirt, .1));
      this.legs.push(segment(this.root, trousers, .15), segment(this.root, trousers, .13));
      this.elbowCaps.push(ellipsoid(this.root, shirt, [0, 0, 0], [.12, .12, .12]));
      this.kneeCaps.push(ellipsoid(this.root, trousers, [0, 0, 0], [.15, .15, .15]));
      this.hands.push(ellipsoid(this.root, skin, [0, 0, 0], [.105, .085, .095]));
      this.shoes.push(ellipsoid(this.root, sole, [0, 0, 0], [.145, .1, .23]));
    }
    const cover = material('#835f3e');
    const paper = material('#eee3c9');
    for (const sign of [-1, 1]) {
      const half = new THREE.Group();
      const page = new THREE.Mesh(new THREE.BoxGeometry(.25, .028, .32), paper);
      const binding = new THREE.Mesh(new THREE.BoxGeometry(.27, .025, .34), cover);
      page.position.set(sign * .12, .026, 0);
      binding.position.x = sign * .12;
      half.add(page, binding);
      half.rotation.z = sign * .2;
      this.book.add(half);
    }
    this.book.position.set(0, .65, -.51);
    this.book.rotation.x = .3;
    this.root.add(this.book);

    this.lamp.position.set(1.03, .13, -.15);
    const brass = material('#514734', .45);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.16, .19, .07, 16), brass);
    this.lamp.add(foot);
    this.lampMaterial = new THREE.MeshStandardMaterial({ color: '#fff3b9', emissive: '#ffbb4b', emissiveIntensity: 2, roughness: .25 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(.105, .12, .27, 16), this.lampMaterial);
    glass.position.y = .17;
    this.lamp.add(glass);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.18, .1, 16), brass);
    cap.position.y = .35;
    this.lamp.add(cap);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.105, .013, 6, 16, Math.PI), brass);
    handle.position.y = .4;
    this.lamp.add(handle);
    this.lampGlow = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffcf6d', transparent: true, opacity: .075, depthWrite: false }));
    this.lampGlow.position.y = .17;
    this.lamp.add(this.lampGlow);
    this.root.add(this.lamp);
    this.update(data.pose, data.busy, 0, 1);
  }

  update(pose: Pose, busy: boolean, time: number, dt: number) {
    const target = poses[pose];
    const blend = this.initialized ? 1 - Math.exp(-dt * 5) : 1;
    const breathe = Math.sin(time * 1.6 + this.data.x) * .014;
    this.currentHip.lerp(new THREE.Vector3(...target.hip), blend);
    this.lean = THREE.MathUtils.lerp(this.lean, target.lean, blend);
    this.body.position.copy(this.currentHip);
    this.body.position.y += breathe;
    this.body.rotation.x = this.lean;
    this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, target.headTilt, blend);
    if (pose === 'stretch') this.body.rotation.z = Math.sin(time * .85) * .06;
    else this.body.rotation.z *= 1 - blend;
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      const hip = this.currentHip.clone().add(new THREE.Vector3(sign * .18, -.01, 0));
      const shoulder = new THREE.Vector3(sign * .3, .57, 0).applyEuler(this.body.rotation).add(this.body.position);
      const knee = this.joints[side * 4].lerp(new THREE.Vector3(...target.knees[side]), blend);
      const foot = this.joints[side * 4 + 1].lerp(new THREE.Vector3(...target.feet[side]), blend);
      const elbow = this.joints[side * 4 + 2].lerp(new THREE.Vector3(...target.elbows[side]), blend);
      const handTarget = new THREE.Vector3(...target.hands[side]);
      if (pose === 'stretch') handTarget.x += Math.sin(time * .85) * .12;
      const hand = this.joints[side * 4 + 3].lerp(handTarget, blend);
      placeSegment(this.legs[side * 2], hip, knee);
      placeSegment(this.legs[side * 2 + 1], knee, foot);
      placeSegment(this.arms[side * 2], shoulder, elbow);
      placeSegment(this.arms[side * 2 + 1], elbow, hand);
      this.kneeCaps[side].position.copy(knee);
      this.elbowCaps[side].position.copy(elbow);
      this.hands[side].position.copy(hand);
      this.shoes[side].position.copy(foot);
    }
    this.book.visible = pose === 'read';
    this.lampMaterial.emissiveIntensity = busy ? 2 + Math.sin(time * 1.6) * .35 : .05;
    this.lampMaterial.color.set(busy ? '#fff0aa' : '#acaa91');
    this.lampGlow.visible = busy;
    this.labelPoint.set(this.data.x, this.root.position.y + (pose === 'stretch' ? 2.9 : pose === 'lie' ? 1.05 : 2), this.data.z);
    this.initialized = true;
  }
}
