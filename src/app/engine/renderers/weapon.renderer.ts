import { COLORS } from '@/shared/colors';
import * as THREE from 'three';

import {
  type Character,
  katanaBlade,
} from '@/app/engine/renderers/character.renderer';
import type { WeaponId } from '@/app/modules/world/types/world.types';

// Modelos das armas: low-poly de cor chapada, sem contorno.
// Flecha apontando para +x, y para cima, espessura em z, simetrico em z.
// Usados no preview do HUD (engine/weapon-preview.ts), na mao do player e na
// dos inimigos que atiram (world.renderer.ts).

// 'ammo' nao e arma: e a foto da municao, usada na recarga da loja
export type WeaponModelId = WeaponId | 'sword' | 'ammo';

export type WeaponModel = { root: THREE.Group; dispose: () => void };

type Kit = {
  paint: (color: number) => THREE.Material;
  add: (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x?: number,
    y?: number,
    z?: number,
  ) => void;
};

// ponta da flecha armada e altura em que ela corre, em unidades do modelo
export const BOW_MUZZLE_X = 2.5;
export const BOW_BORE_Y = 0;

// cilindro ao longo de +x, comecando na origem
function rod(
  radius: number,
  length: number,
  segments = 12,
): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, length, segments)
    .rotateZ(-Math.PI / 2)
    .translate(length / 2, 0, 0);
}

// Arco: meio aro achatado com a barriga para frente (+x) e as pontas em
// (0, +-`half`); `flat` deita o aro no plano xz (a besta leva o arco deitado).
function limbs(
  half: number,
  belly: number,
  flat = false,
): THREE.BufferGeometry {
  const arc = new THREE.TorusGeometry(half, 0.09, 6, 18, Math.PI)
    .rotateZ(-Math.PI / 2)
    .scale(belly / half, 1, 1);
  return flat ? arc.rotateX(Math.PI / 2) : arc;
}

// flecha ao longo de +x, de `from` ate a ponta em `to`: haste, ponta e penas
function arrow(
  { add }: Kit,
  wood: THREE.Material,
  steel: THREE.Material,
  feather: THREE.Material,
  from: number,
  to: number,
  y = 0,
): void {
  add(rod(0.03, to - from - 0.25, 6), wood, from, y);
  add(
    new THREE.ConeGeometry(0.08, 0.25, 6)
      .rotateZ(-Math.PI / 2)
      .translate(to - 0.125, 0, 0),
    steel,
    0,
    y,
  );
  for (const turn of [0, Math.PI / 2]) {
    add(
      new THREE.BoxGeometry(0.3, 0.16, 0.015)
        .rotateX(turn)
        .translate(from + 0.2, 0, 0),
      feather,
      0,
      y,
    );
  }
}

// Arco longo com a flecha armada. O de metal tem as laminas de aco: e o
// arco silencioso.
function bow(kit: Kit, metalBow: boolean): void {
  const { paint, add } = kit;
  const wood = paint(COLORS.model.c5a3d34);
  const steel = paint(COLORS.model.cc8ccd8);
  const body = metalBow ? steel : paint(COLORS.model.ca8703c);
  const [half, belly] = [2, 0.9];
  add(limbs(half, belly), body);
  // empunhadura no meio da barriga
  add(
    new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8),
    metalBow ? paint(COLORS.model.c1c1c28) : wood,
    belly,
  );
  // corda, de ponta a ponta
  add(
    new THREE.CylinderGeometry(0.018, 0.018, half * 2, 4),
    paint(COLORS.model.cf2f2f2),
  );
  arrow(
    kit,
    wood,
    steel,
    paint(metalBow ? COLORS.model.c39d0ff : COLORS.model.cd93636),
    0,
    BOW_MUZZLE_X,
    BOW_BORE_Y,
  );
}

// Besta: coronha de madeira, arco de aco deitado na frente e o virote em
// cima. Solta varios de uma vez (ITEMS.crossbow).
function crossbow(kit: Kit): void {
  const { paint, add } = kit;
  const wood = paint(COLORS.model.c5a3d34);
  const steel = paint(COLORS.model.c9aa0aa);
  add(new THREE.BoxGeometry(2.7, 0.24, 0.28), wood, 0.35);
  // cabo para a mao, embaixo da coronha
  add(new THREE.BoxGeometry(0.22, 0.5, 0.2), wood, -0.55, -0.3);
  const front = 1.5;
  add(limbs(1.3, 0.45, true), steel, front, 0.12);
  // corda entre as pontas do arco
  add(
    new THREE.CylinderGeometry(0.018, 0.018, 2.6, 4).rotateX(Math.PI / 2),
    paint(COLORS.model.cf2f2f2),
    front,
    0.12,
  );
  // estribo na ponta
  add(new THREE.TorusGeometry(0.16, 0.035, 5, 10), steel, front + 0.6, 0);
  arrow(
    kit,
    wood,
    steel,
    paint(COLORS.model.cd9b84a),
    0.1,
    CROSSBOW_MUZZLE[0],
    CROSSBOW_MUZZLE[1],
  );
}
// ponta do virote armado
const CROSSBOW_MUZZLE = [2.3, 0.2];

function sword({ paint, add }: Kit): void {
  add(rod(0.028, 0.26, 8), paint(COLORS.model.c1c1c28), -0.1);
  add(rod(0.085, 0.025), paint(COLORS.model.cd9a441), 0.16);
  add(
    // fio para baixo: a ponta curva para cima
    katanaBlade()
      .rotateY(Math.PI / 2)
      .rotateZ(-Math.PI / 2)
      .rotateX(Math.PI),
    paint(COLORS.model.cc8ccd8),
    0.185,
  );
}

// municao: tres flechas em pe, levemente tortas
function ammo(kit: Kit): void {
  const { paint } = kit;
  const wood = paint(COLORS.model.c5a3d34);
  const steel = paint(COLORS.model.cc8ccd8);
  const feather = paint(COLORS.model.cd93636);
  for (const [x, lean] of [
    [-0.5, 0.12],
    [0, -0.05],
    [0.5, -0.16],
  ]) {
    const upright: Kit = {
      paint,
      // de pe (ponta para cima), cada uma com a sua inclinacao
      add: (geometry, material, gx = 0, gy = 0) =>
        kit.add(
          geometry
            .translate(gx, gy, 0)
            .rotateZ(Math.PI / 2 + lean)
            .translate(x, 0, 0),
          material,
        ),
    };
    arrow(upright, wood, steel, feather, 0, 1.6);
  }
}

export function createWeaponModel(id: WeaponModelId): WeaponModel {
  const root = new THREE.Group();
  const owned: { dispose: () => void }[] = [];
  const kit: Kit = {
    paint(color) {
      const material = new THREE.MeshLambertMaterial({
        color,
        flatShading: true,
      });
      owned.push(material);
      return material;
    },
    add(geometry, material, x = 0, y = 0, z = 0) {
      owned.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      root.add(mesh);
    },
  };
  if (id === 'ammo') ammo(kit);
  else if (id === 'sword') sword(kit);
  else if (id === 'crossbow') crossbow(kit);
  else bow(kit, id === 'metalBow');
  return {
    root,
    dispose() {
      for (const item of owned) item.dispose();
    },
  };
}

// Arma de alcance na mao de um personagem. Medidas em unidades do modelo:
// `grip` e onde a mao segura, `muzzle` a ponta da flecha. `kick` e `flash`
// escalam o recuo e o clarao de cada arma (world.renderer).
export const GUNS: Record<
  WeaponId,
  {
    scale: number;
    grip: number[];
    muzzle: number[];
    kick: number;
    flash: number;
  }
> = {
  // arco nao tem clarao; o recuo e so o braco soltando a corda
  bow: {
    scale: 0.22,
    grip: [0.9, 0],
    muzzle: [BOW_MUZZLE_X, BOW_BORE_Y],
    kick: 0.5,
    flash: 0,
  },
  metalBow: {
    scale: 0.22,
    grip: [0.9, 0],
    muzzle: [BOW_MUZZLE_X, BOW_BORE_Y],
    kick: 0.4,
    flash: 0,
  },
  crossbow: {
    scale: 0.22,
    grip: [-0.55, -0.3],
    muzzle: CROSSBOW_MUZZLE,
    kick: 1.2,
    flash: 0,
  },
};
const GUN_IDS = Object.keys(GUNS) as WeaponId[];
// braco direito estendido para frente, apontando a arma
const GUN_AIM = Math.PI / 2 - 0.1;
// altura da mao no braco
export const HAND_Y = -0.3;

export type HeldGuns = {
  // suporte na mao direita; o recuo desloca ele ao longo do braco
  mount: THREE.Group;
  roots: Record<WeaponId, THREE.Group>;
  // troca o que o personagem segura e a pose do braco; null = espada
  hold: (id: WeaponId | null) => void;
  dispose: () => void;
};

// Um modelo por arma preso a mao direita, todos escondidos ate `hold`. O
// cano (+x do modelo) fica ao longo do braco. Jogo e preview usam o mesmo.
// `size` escala as armas em torno da mao (look.weapon do player).
export function createHeldGuns(character: Character, size = 1): HeldGuns {
  const swordHold = character.hold;
  const mount = new THREE.Group();
  mount.position.y = HAND_Y;
  mount.rotation.z = -Math.PI / 2;
  mount.scale.setScalar(size);
  character.arms[0].add(mount);
  const models = GUN_IDS.map((id) => {
    const model = createWeaponModel(id);
    const { scale, grip } = GUNS[id];
    model.root.scale.setScalar(scale);
    model.root.position.set(-grip[0] * scale, -grip[1] * scale, 0);
    model.root.visible = false;
    mount.add(model.root);
    return model;
  });
  const roots = Object.fromEntries(
    GUN_IDS.map((id, i) => [id, models[i].root]),
  ) as Record<WeaponId, THREE.Group>;
  return {
    mount,
    roots,
    hold(id) {
      character.hold = id ? GUN_AIM : swordHold;
      character.arms[0].rotation.z = character.hold ?? 0;
      if (character.sword) character.sword.visible = !id;
      for (const gun of GUN_IDS) roots[gun].visible = gun === id;
    },
    dispose() {
      mount.removeFromParent();
      for (const model of models) model.dispose();
    },
  };
}
