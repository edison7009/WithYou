import assert from 'node:assert/strict';
import { Avatar } from '../lib/lake/avatar.ts';

const actor = new Avatar({ id: 'you', name: '你', color: '#e1a854', x: 0, z: 4.5, pose: 'sit', busy: true }, .9);
const lamp = actor.lamp.children.find(child => child.material?.emissive?.getHex() > 0);
let seatedHeight = 0;
for (const pose of ['sit', 'read', 'lie', 'stretch']) {
  for (let frame = 0; frame < 150; frame++) actor.update(pose, true, frame / 40, 1 / 40);
  actor.root.updateMatrixWorld(true);
  actor.root.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite), `${pose}: non-finite transform`));
  assert.ok(lamp.material.emissiveIntensity > 1, `${pose}: a working Agent must retain its lamp`);
  if (pose === 'sit') seatedHeight = actor.labelPoint.y;
  if (pose === 'lie') assert.ok(actor.labelPoint.y < seatedHeight, 'lying avatar should sit below the seated avatar');
  if (pose === 'stretch') assert.ok(actor.labelPoint.y > seatedHeight, 'stretching avatar should stand above the seated avatar');
}
actor.update('lie', false, 4, 1);
assert.ok(lamp.material.emissiveIntensity < .1, 'manual Agent idle must dim the lamp independently of pose');
console.log('PASS: four finite poses, seated/lying/standing heights, independent Agent lamp state.');
