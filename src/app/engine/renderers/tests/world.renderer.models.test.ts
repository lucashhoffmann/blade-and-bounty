import * as THREE from 'three';
import { vi } from 'vitest';

import { loadCharacterView } from 'three-hex-engine/three';
import type { CharacterView } from 'three-hex-engine/three';
import { createWorldRenderer } from '@/app/engine/renderers/world.renderer';
import {
  DASH_COOLDOWN,
  SLASH_TIME,
} from '@/app/modules/world/constants/world.constants';
import type { EnemyKind } from '@/app/modules/world/types/world.types';
import {
  DEFAULT_BLOOD_COLOR,
  DEFAULT_LOOK,
} from '@/app/store/game-store/game.store';
import { addEnemy, createArenaWorld } from '@/test/world.fixture';

// o carregador de verdade baixa arquivo: aqui entra um corpo de mentira
vi.mock('three-hex-engine/three', async (original) => ({
  ...(await original<typeof import('three-hex-engine/three')>()),
  loadCharacterView: vi.fn(),
}));
// Modelos de mentira para todo mundo: o teste vale com o jogo usando modelo
// ou nao (character-models.config.ts pode estar vazio).
vi.mock('@/app/engine/characters/character-models.config', () => {
  const model = (url: string) => ({
    url,
    clipsUrl: 'clips',
    rig: {
      scale: 0.5,
      turn: 0,
      slots: {},
      clips: {},
      // arma de alcance: tudo na mao direita, menos o arco
      grips: {
        '': { slot: 'rightHand', forward: [1, 0, 0], up: [0, 1, 0] },
        bow: { slot: 'leftHand', forward: [1, 0, 0], up: [0, 1, 0] },
      },
    },
  });
  return {
    playerModel: () => model('hero'),
    RANGED_STYLES: { bow: 'bow', metalBow: 'bow', crossbow: 'crossbow' },
    ENEMY_MODELS: {
      knight: [model('knight')],
      archer: [model('archer')],
      brute: [model('brute')],
      boss: [model('boss')],
    },
  };
});

function fakeBody(name: string) {
  const object = new THREE.Group();
  object.name = name;
  // ponto da mao, ja com a espada que o carregador prende nele
  const hand = new THREE.Group();
  const blade = new THREE.Group();
  blade.name = `${name}Blade`;
  hand.add(blade);
  object.add(hand);
  return {
    object,
    hand,
    blade,
    pose: vi.fn(),
    slot: (slot: string) => (slot === 'rightHand' ? hand : null),
    highlight: vi.fn(),
    dispose: vi.fn(() => object.removeFromParent()),
  } satisfies CharacterView & { hand: THREE.Group; blade: THREE.Group };
}

// deixa a promessa do carregador resolver
const arrive = () => new Promise((resolve) => setTimeout(resolve, 0));

// um inimigo de `kind` e o player, cada um com o proprio corpo de mentira
function setup(kind: EnemyKind = 'knight') {
  const foe = fakeBody('foeBody');
  const hero = fakeBody('heroBody');
  vi.mocked(loadCharacterView)
    .mockReset()
    .mockImplementation(async (model) => (model.url === 'hero' ? hero : foe));
  const world = createArenaWorld();
  const enemy = addEnemy(world, 5.5, 8.5, Math.PI / 2, kind);
  const scene = new THREE.Scene();
  const renderer = createWorldRenderer(
    scene,
    DEFAULT_LOOK,
    DEFAULT_BLOOD_COLOR,
  );
  return { foe, hero, world, enemy, scene, renderer };
}
// O renderer anda no maximo 0.1 s por quadro: deixa passar 2 s, em quadros,
// a partir de `from`, para os tempos que ele marca sozinho acabarem.
function settle(
  renderer: ReturnType<typeof createWorldRenderer>,
  world: Parameters<ReturnType<typeof createWorldRenderer>['sync']>[0],
  from: number,
) {
  for (let i = 1; i <= 20; i++) renderer.sync(world, from + i * 0.1);
}
const lastPose = (body: ReturnType<typeof fakeBody>) =>
  body.pose.mock.calls.at(-1)![0];
// o corpo de pecas e o grupo cheio de filhos dentro do root
const parts = (body: ReturnType<typeof fakeBody>) =>
  body.object.parent!.children.find(
    (child) => child !== body.object && child.children.length > 0,
  )!;

describe('inimigo com corpo de modelo', () => {
  it('jogador e inimigo olham para os dois lados com a cabeca', async () => {
    const { hero, foe, world, renderer } = setup();
    renderer.sync(world, 1);
    await arrive();
    const heroLooks: number[] = [];
    const foeLooks: number[] = [];
    for (let i = 1; i <= 80; i++) {
      renderer.sync(world, 1 + i * 0.1);
      heroLooks.push(lastPose(hero).look ?? 0);
      foeLooks.push(lastPose(foe).look ?? 0);
    }
    for (const looks of [heroLooks, foeLooks]) {
      expect(Math.max(...looks)).toBeGreaterThan(0.2);
      expect(Math.min(...looks)).toBeLessThan(-0.2);
    }
    renderer.dispose();
  });

  it('enquanto o modelo nao chega nada do corpo aparece; depois, so o modelo', async () => {
    const { foe, world, scene, renderer } = setup();
    renderer.sync(world, 1);
    expect(scene.getObjectByName('foeBody')).toBeUndefined();
    expect(foe.pose).not.toHaveBeenCalled();
    // o de pecas ja esta em cena (segura posicao e marcadores), escondido
    const marker = scene.getObjectByName('rageMarker')!;
    const hidden = marker.parent!.parent!.children.filter(
      (child) => child.children.length > 3 && !child.visible,
    );
    expect(hidden).toHaveLength(1);

    await arrive();
    renderer.sync(world, 1.1);
    // mesmo root dos marcadores: posicao e icones nao mudam
    expect(foe.object.parent!.getObjectByName('rageMarker')).toBeDefined();
    expect(parts(foe).visible).toBe(false);
    expect(foe.pose).toHaveBeenCalled();
    renderer.dispose();
  });

  it('quem golpeia recebe a fase do golpe; de longe, o golpe e arremesso', async () => {
    const { foe, world, enemy, renderer } = setup('knight');
    renderer.sync(world, 1);
    await arrive();

    renderer.sync(world, 1.1);
    expect(lastPose(foe)).toMatchObject({ attack: null, shot: null });

    // colado no player: golpe
    world.player.pos = { x: 5.5, y: 7.6 };
    enemy.attack = SLASH_TIME / 4;
    renderer.sync(world, 1.2);
    expect(lastPose(foe).attack).toBeCloseTo(0.75);
    expect(lastPose(foe).throwing).toBeNull();
    expect(lastPose(foe).shot).toBeNull();

    // longe: a mesma fase vira arremesso
    world.player.pos = { x: 5.5, y: 2.5 };
    renderer.sync(world, 1.3);
    expect(lastPose(foe).attack).toBeNull();
    expect(lastPose(foe).throwing).toBeCloseTo(0.75);
    renderer.dispose();
  });

  it('cada inimigo leva o proprio numero, para variar a animacao; levar golpe estremece', async () => {
    const { foe, world, enemy, renderer } = setup('knight');
    renderer.sync(world, 1);
    await arrive();
    renderer.sync(world, 1.1);
    expect(lastPose(foe).variant).toBe(enemy.id);
    expect(lastPose(foe).hit).toBeNull();

    enemy.hp -= 10;
    renderer.sync(world, 1.2);
    expect(lastPose(foe).hit).toBeGreaterThanOrEqual(0);
    // passa sozinho
    settle(renderer, world, 1.2);
    expect(lastPose(foe).hit).toBeNull();
    renderer.dispose();
  });

  it('quem atira ganha a arma no encaixe, aponta em alerta e dispara pela fase', async () => {
    const { foe, world, enemy, renderer } = setup('archer');
    renderer.sync(world, 1);
    await arrive();
    // a espada de mentira mais o encaixe com a arma de alcance do jogo
    expect(foe.hand.children).toHaveLength(2);

    renderer.sync(world, 1.1);
    expect(lastPose(foe)).toMatchObject({ aiming: false, shot: null });

    enemy.state = 'alert';
    renderer.sync(world, 1.2);
    expect(lastPose(foe)).toMatchObject({ aiming: true, shot: null });

    enemy.attack = SLASH_TIME / 2;
    renderer.sync(world, 1.3);
    expect(lastPose(foe).shot).toBeCloseTo(0.5);
    expect(lastPose(foe).attack).toBeNull();
    renderer.dispose();
  });

  it('chefe grita o desafio quando entra em alerta', async () => {
    const { foe, world, enemy, renderer } = setup('boss');
    renderer.sync(world, 1);
    await arrive();
    renderer.sync(world, 1.1);
    expect(lastPose(foe).taunt).toBeNull();
    enemy.state = 'alert';
    renderer.sync(world, 1.2);
    expect(lastPose(foe).taunt).toBeGreaterThanOrEqual(0);
    settle(renderer, world, 1.2);
    expect(lastPose(foe).taunt).toBeNull();
    renderer.dispose();
  });

  it('morto: o modelo recebe `dead` e o root fica de pe (quem cai e o clipe)', async () => {
    const { foe, world, enemy, renderer } = setup();
    renderer.sync(world, 1);
    await arrive();
    enemy.state = 'dead';
    renderer.sync(world, 1.1);
    expect(lastPose(foe).dead).toBe(true);
    const root = foe.object.parent!;
    expect(root.rotation.z).toBe(0);
    expect(root.position.y).toBe(0);
    renderer.dispose();
  });

  it('furia destaca o corpo de modelo e a calma tira', async () => {
    const { foe, world, enemy, renderer } = setup();
    renderer.sync(world, 1);
    await arrive();
    renderer.sync(world, 1.1);
    expect(foe.highlight).toHaveBeenLastCalledWith(null);
    enemy.enraged = true;
    renderer.sync(world, 1.2);
    expect(foe.highlight).toHaveBeenLastCalledWith(expect.any(Number));
    renderer.dispose();
  });

  it('inimigo que sai de cena descarta o modelo, mesmo se ele chegar depois', async () => {
    const late = setup();
    late.renderer.sync(late.world, 1);
    late.world.enemies = [];
    late.renderer.sync(late.world, 1.1);
    await arrive();
    expect(late.foe.dispose).toHaveBeenCalled();
    expect(late.scene.getObjectByName('foeBody')).toBeUndefined();

    const seen = setup();
    seen.renderer.sync(seen.world, 1);
    await arrive();
    seen.renderer.sync(seen.world, 1.1);
    seen.world.enemies = [];
    seen.renderer.sync(seen.world, 1.2);
    expect(seen.foe.dispose).toHaveBeenCalled();
    late.renderer.dispose();
    seen.renderer.dispose();
  });

  it('arquivo que nao chega nao quebra o jogo: aparece o corpo de pecas', async () => {
    const { world, scene, renderer } = setup();
    vi.mocked(loadCharacterView)
      .mockReset()
      .mockRejectedValue(new Error('rede'));
    const again = createWorldRenderer(scene, DEFAULT_LOOK, DEFAULT_BLOOD_COLOR);
    again.sync(world, 1);
    await arrive();
    expect(() => again.sync(world, 1.1)).not.toThrow();
    expect(scene.getObjectByName('foeBody')).toBeUndefined();
    expect(scene.getObjectByName('heroBody')).toBeUndefined();
    // os corpos de pecas dos dois renderers: o que falhou mostra o seu
    const shown = scene.children
      .flatMap((root) => root.children)
      .filter((child) => child.children.length > 3 && child.visible);
    expect(shown.length).toBeGreaterThan(0);
    renderer.dispose();
    again.dispose();
  });
});

describe('player com corpo de modelo', () => {
  async function ready() {
    const made = setup();
    made.world.enemies = [];
    made.renderer.sync(made.world, 1);
    await arrive();
    made.renderer.sync(made.world, 1.1);
    return made;
  }

  it('entra no lugar do corpo de pecas e recebe agachar e golpe', async () => {
    const { hero, world, renderer } = await ready();
    expect(parts(hero).visible).toBe(false);
    expect(lastPose(hero)).toMatchObject({ crouching: false, attack: null });

    world.player.crouching = true;
    world.player.slash = SLASH_TIME / 2;
    renderer.sync(world, 1.2);
    expect(lastPose(hero).crouching).toBe(true);
    expect(lastPose(hero).attack).toBeCloseTo(0.5);
    renderer.dispose();
  });

  it('golpe que comeca no salto gira ate o fim, mesmo com a recarga acabando no meio', async () => {
    const { hero, world, renderer } = await ready();
    world.player.dashCooldown = DASH_COOLDOWN;
    world.player.slash = SLASH_TIME;
    renderer.sync(world, 1.2);
    expect(lastPose(hero).spinning).toBe(true);

    world.player.dashCooldown = 0;
    world.player.slash = SLASH_TIME / 2;
    renderer.sync(world, 1.3);
    expect(lastPose(hero).spinning).toBe(true);

    // golpe seguinte, fora do salto: corte comum
    world.player.slash = 0;
    renderer.sync(world, 1.4);
    world.player.slash = SLASH_TIME;
    renderer.sync(world, 1.5);
    expect(lastPose(hero).spinning).toBe(false);
    renderer.dispose();
  });

  it('com arma de alcance: a espada some, a arma vai para o encaixe do estilo e ele aponta', async () => {
    const { hero, world, renderer } = await ready();
    expect(hero.blade.visible).toBe(true);
    expect(lastPose(hero)).toMatchObject({ aiming: false, shot: null });
    // a espada e o encaixe da mao direita
    expect(hero.hand.children).toHaveLength(2);

    const crossbow = { id: 'crossbow' as const, ammo: 5 };
    world.player.arsenal = [crossbow];
    world.player.weapon = crossbow;
    renderer.sync(world, 1.2);
    expect(hero.blade.visible).toBe(false);
    expect(lastPose(hero)).toMatchObject({
      aiming: true,
      shot: null,
      style: 'crossbow',
    });
    renderer.dispose();
  });

  it('golpe levado estremece o corpo; se o escudo segurou, avisa', async () => {
    const { hero, world, renderer } = await ready();
    world.player.shield = 20;
    renderer.sync(world, 1.2);
    world.player.shield = 5;
    renderer.sync(world, 1.3);
    expect(lastPose(hero)).toMatchObject({ blocked: true });
    expect(lastPose(hero).hit).toBeGreaterThanOrEqual(0);

    settle(renderer, world, 1.3);
    world.player.hp -= 10;
    renderer.sync(world, 9);
    expect(lastPose(hero)).toMatchObject({ blocked: false });
    expect(lastPose(hero).hit).toBeGreaterThanOrEqual(0);
    renderer.dispose();
  });

  it('invisivel esconde o corpo de modelo e nao volta a mostrar o de pecas', async () => {
    const { hero, world, renderer } = await ready();
    world.player.invisible = 5;
    renderer.sync(world, 1.2);
    expect(hero.object.visible).toBe(false);
    expect(parts(hero).visible).toBe(false);

    world.player.invisible = 0;
    renderer.sync(world, 1.3);
    expect(hero.object.visible).toBe(true);
    renderer.dispose();
  });

  it('raiva depois de matar destaca o corpo; morto, recebe `dead` de pe', async () => {
    const { hero, world, renderer } = await ready();
    world.player.adrenaline = 1;
    renderer.sync(world, 1.2);
    expect(hero.highlight).toHaveBeenLastCalledWith(expect.any(Number));

    world.player.hp = 0;
    renderer.sync(world, 1.3);
    expect(lastPose(hero).dead).toBe(true);
    expect(hero.object.parent!.rotation.z).toBe(0);
    renderer.dispose();
  });
});
