import * as THREE from 'three';

import { createCharacterKit } from '@/app/engine/renderers/character.renderer';
import {
  createHeldGuns,
  createWeaponModel,
  BOW_BORE_Y,
  BOW_MUZZLE_X,
  type WeaponModelId,
} from '@/app/engine/renderers/weapon.renderer';
import { DEFAULT_LOOK } from '@/app/store/game-store/game.store';

function bounds(id: WeaponModelId): THREE.Box3 {
  return new THREE.Box3().setFromObject(createWeaponModel(id).root);
}

describe('createWeaponModel', () => {
  it.each(['sword', 'bow', 'metalBow', 'crossbow'] as const)(
    '%s: aponta para +x e e simetrica em z',
    (id) => {
      const box = bounds(id);
      expect(box.max.x).toBeGreaterThan(-box.min.x);
      expect(box.min.z).toBeCloseTo(-box.max.z);
    },
  );

  it('arco fica de pe: mais alto que comprido, com a flecha ate BOW_MUZZLE_X', () => {
    for (const id of ['bow', 'metalBow'] as const) {
      const box = bounds(id);
      const size = box.getSize(new THREE.Vector3());
      expect(size.y).toBeGreaterThan(size.x);
      expect(box.max.x).toBeCloseTo(BOW_MUZZLE_X);
      expect(box.max.y).toBeCloseTo(-box.min.y);
      expect(BOW_BORE_Y).toBe(0);
    }
  });

  it('arco de metal e o mesmo arco, com outro material', () => {
    expect(bounds('metalBow').equals(bounds('bow'))).toBe(true);
    const color = (id: 'bow' | 'metalBow') =>
      (
        (createWeaponModel(id).root.children[0] as THREE.Mesh)
          .material as THREE.MeshLambertMaterial
      ).color.getHex();
    expect(color('metalBow')).not.toBe(color('bow'));
  });

  it('besta e deitada: mais larga em z que alta', () => {
    const size = bounds('crossbow').getSize(new THREE.Vector3());
    expect(size.z).toBeGreaterThan(size.y);
  });
});

it('createHeldGuns troca espada por arma na mao direita e volta', () => {
  const character = createCharacterKit(DEFAULT_LOOK).make('player');
  const swordArm = character.arms[0].rotation.z;
  const held = createHeldGuns(character);
  expect(held.mount.parent).toBe(character.arms[0]);

  held.hold('crossbow');
  expect(held.roots.crossbow.visible).toBe(true);
  expect(held.roots.bow.visible).toBe(false);
  expect(character.sword?.visible).toBe(false);
  // braco estendido para frente
  expect(character.arms[0].rotation.z).toBeGreaterThan(1);

  held.hold(null);
  expect(held.roots.crossbow.visible).toBe(false);
  expect(character.sword?.visible).toBe(true);
  expect(character.arms[0].rotation.z).toBe(swordArm);
});
