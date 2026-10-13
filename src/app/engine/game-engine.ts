import { COLORS } from '@/shared/colors';
import * as THREE from 'three';

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
const MAX_FRAME_TIME = 0.1;
// teto de pixels por ponto da tela, por qualidade dos graficos
const PIXEL_RATIO = { high: 2, medium: 1.5, low: 1 };
// quadro a menos disto de um numero inteiro de passos conta como inteiro
const FRAME_SNAP = 0.15;
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

function axis(keys: Set<string>, positive: string[], negative: string[]) {
  const has = (codes: string[]) => codes.some((code) => keys.has(code));
  return (has(positive) ? 1 : 0) - (has(negative) ? 1 : 0);
}

export function createGameEngine(canvas: HTMLCanvasElement): GameEngine {
  // Graficos das configuracoes, lidos uma vez (como `look`): quantos pixels
  // desenhar, o que mais pesa em celular, e se ha o desfoque de CSS no canvas
  const { graphics } = useGameStore.getState();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: graphics.quality !== 'low',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, PIXEL_RATIO[graphics.quality]),
  );

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.ui.background);
  scene.add(
    new THREE.HemisphereLight(COLORS.model.cffffff, COLORS.model.c444466, 1.8),
  );
  const sun = new THREE.DirectionalLight(COLORS.model.cffffff, 1.4);
  sun.position.set(3, 10, 5);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  const { look, bloodColor } = useGameStore.getState();
  const view = createWorldRenderer(scene, look, bloodColor, graphics.crows);

  const keys = new Set<string>();
  const input: InputState = { moveX: 0, moveY: 0, dash: false };
  const onKeyDown = (event: KeyboardEvent) => {
    keys.add(event.code);
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
    keys.delete(event.code);
    if (event.code === 'Tab') useGameStore.getState().setScoreboard(false);
  };
  const onBlur = () => {
    keys.clear();
    useGameStore.getState().setScoreboard(false);
    input.interact = false;
    input.open = false;
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  // captura: chega antes do joystick, que cobre a parte de baixo da tela
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  let accumulator = 0;
  let frameId = 0;
  let kills = 0;
  let hp = 0;
  let punch = 0;
  let dealt = 0;
  let hurt = 0;
  let chase = 0;
  const focus = { x: 0, y: 0 };

  const frame = (now: number) => {
    frameId = requestAnimationFrame(frame);
    let frameTime = Math.min(MAX_FRAME_TIME, (now - last) / 1000);
    // Tela a 60 Hz entrega quadros de quase um passo, nunca exato: a sobra
    // acumulava ate um quadro rodar dois passos e outro nenhum, e a imagem
    // dava um tranco. Quadro que e quase N passos vale N passos
    const steps = Math.round(frameTime / FIXED_DT);
    if (steps >= 1 && Math.abs(frameTime / FIXED_DT - steps) < FRAME_SNAP) {
      frameTime = steps * FIXED_DT;
    }
    accumulator += frameTime;
    last = now;

    input.moveX =
      axis(keys, ['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) +
      joystickInput.moveX;
    input.moveY =
      axis(keys, ['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']) +
      joystickInput.moveY;
    input.dash = keys.has('Space') || joystickInput.dash;
    // botao de ataque do toque: pulso unico, como a tecla F
    if (joystickInput.interact) {
      joystickInput.interact = false;
      if (getWorld()?.status === 'playing') input.interact = true;
    }
    input.crouch =
      keys.has('ControlLeft') ||
      keys.has('ControlRight') ||
      keys.has('KeyC') ||
      !!joystickInput.crouch;

    // passo fixo: a simulacao nao depende do fps
    const tick = useGameStore.getState().tick;
    while (accumulator >= FIXED_DT) {
      tick(input, FIXED_DT);
      input.interact = false;
      input.open = false;
      accumulator -= FIXED_DT;
    }

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
    renderer.render(scene, camera);
  };
  frameId = requestAnimationFrame(frame);

  return {
    dispose() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', resize);
      canvas.style.filter = '';
      view.dispose();
      renderer.dispose();
    },
  };
}
