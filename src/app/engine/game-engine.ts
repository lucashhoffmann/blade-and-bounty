import { createEngine } from 'three-hex-engine/core';
import { rafClock } from 'three-hex-engine/clock';
import {
  MOVE,
  combineInputs,
  createGamepadInput,
  createKeyboardInput,
} from 'three-hex-engine/input';
import { createThreeRenderer } from 'three-hex-engine/three';
import * as THREE from 'three';

import { COLORS } from '@/shared/colors';

import { createWorldRenderer } from '@/app/engine/renderers/world.renderer';
import {
  CRIT_FOCUS_TIME,
  DASH_TIME,
  FIXED_DT,
} from '@/app/modules/world/constants/world.constants';
import type { InputState } from '@/app/modules/world/types/world.types';
import {
  getWorld,
  joystickInput,
  useGameStore,
} from '@/app/store/game-store/game.store';

// Contrato em docs/contracts.md (secao Engine).

const CAMERA_HEIGHT = 13;
const CAMERA_BACK = 7;
const CAMERA_FOV = 45;
// soco de camera ao matar, ao levar dano e ao acertar: zoom curto com blur
// que se desfaz
// por quanto tempo (ms) o clique que vem de um toque em icone e ignorado
const PROMPT_CLICK_GUARD = 600;
const PUNCH_TIME = 0.42;
const PUNCH_ZOOM = 5.5;
const PUNCH_BLUR = 4;
// golpe do player que acerta: soco menor; critico, overkill e na mosca valem
// o soco inteiro
const HIT_PUNCH = 0.45;
// dano levado: a camera treme por HURT_TIME, ate HURT_SHAKE de lado
const HURT_TIME = 0.3;
const HURT_SHAKE = 0.16;
// Perseguicao (algum inimigo em alerta): a camera fecha um pouco e bate como
// coracao, CHASE_BEATS vezes por segundo. Entra e sai em CHASE_EASE segundos.
const CHASE_ZOOM = 2.4;
const CHASE_BEAT_ZOOM = 1.3;
const CHASE_BEAT_BLUR = 0.9;
const CHASE_BEATS = 2.2;
const CHASE_EASE = 0.5;
// F no corpo a corpo (`player.clash`): zoom e blur menores que os do soco,
// que duram enquanto o jogador segue apertando
const CLASH_ZOOM = 3;
const CLASH_BLUR = 1.7;
// raio, em px na tela, em que o toque conta como em cima do icone de
// interacao; folgado, para caber um dedo
const PROMPT_TAP_RADIUS = 44;
// blur de velocidade no dash do player: cresce e some junto com o salto
const DASH_BLUR = 2.2;
const CAMERA_FOLLOW_RATE = 14;
const CAMERA_SNAP_DISTANCE = 3;

export type GameEngine = { dispose: () => void };

// controles segurados; teclado e gamepad (adapters de input da engine)
const DASH = ['Space', 'PadA'];
const CROUCH = ['ControlLeft', 'ControlRight', 'KeyC', 'PadB'];

export function createGameEngine(canvas: HTMLCanvasElement): GameEngine {
  // Graficos das configuracoes, lidos uma vez (como `look`): quantos pixels
  // desenhar, o que mais pesa em celular, e se ha o desfoque de CSS no canvas
  const { graphics } = useGameStore.getState();
  const gfx = createThreeRenderer(canvas, {
    quality: graphics.quality,
    fov: CAMERA_FOV,
  });
  const { scene, camera } = gfx;
  const controls = combineInputs(createKeyboardInput(), createGamepadInput());

  scene.background = new THREE.Color(COLORS.ui.background);
  scene.add(
    new THREE.HemisphereLight(COLORS.model.cffffff, COLORS.model.c444466, 1.8),
  );
  const sun = new THREE.DirectionalLight(COLORS.model.cffffff, 1.4);
  sun.position.set(3, 10, 5);
  scene.add(sun);

  const { look, bloodColor } = useGameStore.getState();
  const view = createWorldRenderer(scene, look, bloodColor, graphics.crows);

  const input: InputState = { moveX: 0, moveY: 0, dash: false };
  // atalhos de uma vez e preventDefault; o que fica segurado vem de `controls`
  const onKeyDown = (event: KeyboardEvent) => {
    // Ctrl agacha e as setas movem: evita atalhos e rolagem do navegador.
    // Ctrl+W (fechar aba) o navegador nao deixa bloquear; por isso C tambem agacha.
    if (
      (event.ctrlKey || event.code.startsWith('Arrow')) &&
      getWorld()?.status === 'playing'
    )
      event.preventDefault();
    // Tab segurado mostra o placar; sem isto o foco sairia do jogo
    if (event.code === 'Tab' && getWorld()) {
      event.preventDefault();
      useGameStore.getState().setScoreboard(true);
    }
    if (event.repeat) return;
    if (event.code === 'KeyP') useGameStore.getState().togglePause();
    // so em desenvolvimento: pula para a proxima sala de loja
    if (event.code === 'F8') useGameStore.getState().devSkipToShop();
    if (event.code === 'Enter') useGameStore.getState().begin();
    if (event.code === 'KeyF' && getWorld()?.status === 'playing')
      input.interact = true;
    // Q troca a arma na mao: espada, depois cada arma do arsenal
    if (event.code === 'KeyQ') useGameStore.getState().cycleWeapon();
    // B abre o bau ao alcance e fecha a loja aberta
    if (event.code === 'KeyB') {
      // pela tela, nao pelo mundo: em rede a loja e de cada jogador
      if (useGameStore.getState().screen === 'shop')
        useGameStore.getState().closeShop();
      else if (getWorld()?.status === 'playing') input.open = true;
    }
  };
  // Toque ou clique em cima do icone flutuante (F, B) faz o que a tecla
  // faria: no celular e o unico jeito de quebrar caixa, esfaquear e abrir bau.
  const spot = new THREE.Vector3();
  // O toque num icone abre a loja (ou outro dialogo) antes de o dedo subir.
  // No celular o clique desse mesmo toque cairia no que apareceu embaixo do
  // dedo: comprava sozinho o cartao da loja que nascesse ali. Engole esse
  // unico clique.
  const swallowClick = () => {
    const swallow = (click: MouseEvent) => {
      click.stopPropagation();
      click.preventDefault();
    };
    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(
      () => window.removeEventListener('click', swallow, { capture: true }),
      PROMPT_CLICK_GUARD,
    );
  };

  const onPointerDown = (event: PointerEvent) => {
    if (getWorld()?.status !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    for (const { action, object } of view.prompts()) {
      // posicao do icone na tela
      object.getWorldPosition(spot).project(camera);
      const x = rect.left + ((spot.x + 1) / 2) * rect.width;
      const y = rect.top + ((1 - spot.y) / 2) * rect.height;
      if (
        Math.hypot(event.clientX - x, event.clientY - y) > PROMPT_TAP_RADIUS
      ) {
        continue;
      }
      input[action] = true;
      // o toque e do icone: nao comeca o joystick que esta por baixo
      event.stopPropagation();
      swallowClick();
      return;
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Tab') useGameStore.getState().setScoreboard(false);
  };
  const onBlur = () => {
    useGameStore.getState().setScoreboard(false);
    input.interact = false;
    input.open = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  // captura: chega antes do joystick, que cobre a parte de baixo da tela
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('blur', onBlur);

  let kills = 0;
  let hp = 0;
  let punch = 0;
  let dealt = 0;
  let hurt = 0;
  let chase = 0;
  const focus = { x: 0, y: 0 };

  // laco de passo fixo da engine: a simulacao nao depende do fps
  const engine = createEngine({
    fixedDt: FIXED_DT,
    clock: rafClock,
    ports: { renderer: gfx, input: controls },
    update() {
      input.moveX = controls.axis(MOVE.right, MOVE.left) + joystickInput.moveX;
      input.moveY = controls.axis(MOVE.up, MOVE.down) + joystickInput.moveY;
      input.dash = DASH.some(controls.isDown) || joystickInput.dash;
      // botao de ataque do toque: pulso unico, como a tecla F
      if (joystickInput.interact) {
        joystickInput.interact = false;
        if (getWorld()?.status === 'playing') input.interact = true;
      }
      input.crouch = CROUCH.some(controls.isDown) || !!joystickInput.crouch;
    },
    step(dt) {
      useGameStore.getState().tick(input, dt);
      input.interact = false;
      input.open = false;
    },
    render: ({ now, frameTime }) => draw(now, frameTime),
  });

  const draw = (now: number, frameTime: number) => {
    const world = getWorld();
    if (!world) return;
    view.sync(world, now / 1000);

    // escudo absorvendo tambem conta como dano levado
    const health = world.player.hp + world.player.shield;
    if (world.run.kills > kills || health < hp) punch = 1;
    if (health < hp) hurt = 1;
    // golpe que entrou: soco pequeno; com destaque (critico, overkill, na
    // mosca), o inteiro
    if (world.run.stats.damageDealt > dealt) {
      const big = world.floaters.some(
        (floater) =>
          !floater.onPlayer &&
          floater.age < 0.1 &&
          (floater.critical || floater.overkill || floater.headshot),
      );
      punch = Math.max(punch, big ? 1 : HIT_PUNCH);
    }
    kills = world.run.kills;
    hp = health;
    dealt = world.run.stats.damageDealt;
    punch = Math.max(0, punch - frameTime / PUNCH_TIME);
    hurt = Math.max(0, hurt - frameTime / HURT_TIME);
    // perseguicao: entra e sai aos poucos; o batimento e um pulso curto
    const hunted =
      world.status === 'playing' &&
      world.player.hp > 0 &&
      world.enemies.some((enemy) => enemy.state === 'alert');
    chase +=
      Math.sign((hunted ? 1 : 0) - chase) *
      Math.min(Math.abs((hunted ? 1 : 0) - chase), frameTime / CHASE_EASE);
    const beat =
      chase * Math.max(0, Math.sin((now / 1000) * Math.PI * CHASE_BEATS)) ** 6;
    const { dash } = world.player;
    const clash = world.player.clash / CRIT_FOCUS_TIME;
    camera.fov =
      CAMERA_FOV -
      PUNCH_ZOOM * punch -
      CLASH_ZOOM * clash -
      CHASE_ZOOM * chase -
      CHASE_BEAT_ZOOM * beat;
    camera.updateProjectionMatrix();
    const rush =
      dash > 0 ? Math.sin(Math.PI * (1 - dash / DASH_TIME)) * DASH_BLUR : 0;
    // o mais forte vale; nao somam
    const blur = Math.max(
      punch * PUNCH_BLUR,
      rush,
      clash * CLASH_BLUR,
      beat * CHASE_BEAT_BLUR,
    );
    if (graphics.blur) {
      canvas.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
    }

    // camera segue suavizada, como o personagem (ver world.renderer animate)
    // morto no multiplayer assiste: a camera passa a seguir um colega vivo
    const followed =
      world.player.hp > 0
        ? world.player
        : (world.players.find((p) => p.hp > 0) ?? world.player);
    const { x, y } = followed.pos;
    const far = Math.hypot(x - focus.x, y - focus.y) > CAMERA_SNAP_DISTANCE;
    const follow = far ? 1 : Math.min(1, frameTime * CAMERA_FOLLOW_RATE);
    focus.x += (x - focus.x) * follow;
    focus.y += (y - focus.y) * follow;
    // tremor do dano: desloca camera e alvo juntos, para nao girar a vista
    const shakeX = (Math.random() - 0.5) * 2 * HURT_SHAKE * hurt;
    const shakeZ = (Math.random() - 0.5) * 2 * HURT_SHAKE * hurt;
    camera.position.set(
      focus.x + shakeX,
      CAMERA_HEIGHT,
      -focus.y + CAMERA_BACK + shakeZ,
    );
    camera.lookAt(focus.x + shakeX, 0, -focus.y + shakeZ);
    gfx.render();
  };
  engine.start();

  return {
    dispose() {
      engine.stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('blur', onBlur);
      canvas.style.filter = '';
      view.dispose();
      // controles e renderer
      engine.dispose();
    },
  };
}
