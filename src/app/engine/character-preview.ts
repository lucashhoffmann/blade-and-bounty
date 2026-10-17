import { COLORS } from '@/shared/colors';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { loadCharacterView } from 'three-hex-engine/three';
import {
  PLAYER_OUTFITS,
  playerModel,
  RANGED_STYLES,
} from '@/app/engine/characters/character-models.config';
import type { CharacterPose, CharacterView } from 'three-hex-engine/three';
import {
  createWeaponModel,
  GUNS,
  type WeaponModel,
} from '@/app/engine/renderers/weapon.renderer';
import type { WeaponId } from '@/app/modules/world/types/world.types';
import type { PlayerLook } from '@/app/store/game-store/game.store';

// Preview do player na tela de personagem: o mesmo modelo da partida, parado
// e respirando. Arrastar gira, roda do mouse aproxima.

export type CharacterPreview = {
  setLook: (look: PlayerLook) => void;
  // o que o player segura no preview; null = espada
  setWeapon: (id: WeaponId | null) => void;
  dispose: () => void;
};

const REST: CharacterPose = {
  moving: 0,
  crouching: false,
  attack: null,
  dash: null,
  shot: null,
  swing: 0,
  spinning: false,
  dead: false,
};
// trocou de skin ou de arma: o personagem comemora uma vez
const CHEER_TIME = 1.6;

export function createCharacterPreview(
  canvas: HTMLCanvasElement,
): CharacterPreview {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // mesma luz e fundo do jogo, para a cor do preview ser a cor da run
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.ui.background);
  scene.add(
    new THREE.HemisphereLight(COLORS.model.cffffff, COLORS.model.c444466, 1.8),
  );
  const sun = new THREE.DirectionalLight(COLORS.model.cffffff, 1.4);
  sun.position.set(3, 10, 5);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 48),
    new THREE.MeshLambertMaterial({ color: COLORS.ui.border }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // personagem olha para +x: a camera comeca de frente, um pouco de lado
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(3, 1.8, 1.6);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.75, 0);
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI / 2;
  controls.update();

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let look: PlayerLook | null = null;
  let body: CharacterView | null = null;
  let blade: THREE.Object3D | null = null;
  let gun: WeaponModel | null = null;
  let weapon: WeaponId | null = null;
  let disposed = false;
  let cheer = 0;

  // troca o que esta na mao do modelo atual
  const hold = () => {
    gun?.root.removeFromParent();
    gun?.dispose();
    gun = null;
    if (blade) blade.visible = !weapon;
    const hand = body?.slot('rightHand');
    if (!weapon || !hand || !look) return;
    // a arma do jogo, no tamanho certo apesar da escala do modelo
    gun = createWeaponModel(weapon);
    const size =
      (GUNS[weapon].scale * look.weapon) /
      PLAYER_OUTFITS[look.outfit].rig.scale;
    const [gripX, gripY] = GUNS[weapon].grip;
    gun.root.scale.setScalar(size);
    gun.root.position.set(-gripX * size, -gripY * size, 0);
    hand.add(gun.root);
  };

  // o modelo respira: o preview tem laco proprio
  let last = performance.now();
  let frame = requestAnimationFrame(function loop(now) {
    frame = requestAnimationFrame(loop);
    const dt = (now - last) / 1000;
    last = now;
    cheer = Math.max(0, cheer - dt);
    body?.pose(
      {
        ...REST,
        aiming: !!weapon,
        style: weapon
          ? RANGED_STYLES[weapon]
          : look
            ? playerModel(look).style
            : undefined,
        emote:
          cheer > 0 ? { name: 'cheer', phase: 1 - cheer / CHEER_TIME } : null,
      },
      dt,
    );
    renderer.render(scene, camera);
  });

  return {
    setLook(next) {
      // corpo ou arma na mao mudou: monta o modelo de novo
      const changed =
        next.outfit !== look?.outfit || next.blade !== look?.blade;
      look = next;
      if (!changed) return hold();
      const { outfit, blade: held } = next;
      void loadCharacterView(playerModel(next)).then(
        (view) => {
          // trocou de novo, ou saiu da tela, antes deste chegar
          if (disposed || look?.outfit !== outfit || look?.blade !== held) {
            return view.dispose();
          }
          gun?.dispose();
          gun = null;
          // nao na primeira vez: so quando ele troca de visual
          if (body) cheer = CHEER_TIME;
          body?.dispose();
          body = view;
          blade = view.slot('rightHand')?.children[0] ?? null;
          scene.add(view.object);
          hold();
        },
        () => {},
      );
    },
    setWeapon(id) {
      weapon = id;
      hold();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      gun?.dispose();
      body?.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();
    },
  };
}
