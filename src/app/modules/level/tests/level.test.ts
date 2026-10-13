import { createEnemy } from '@/app/modules/enemy/systems/enemy.system';
import {
  bossMaxHp,
  goldenChestChance,
  pickTemplate,
  spawnRoom,
  updateRooms,
} from '@/app/modules/level/systems/level.system';
import {
  BOSS_TEMPLATE,
  COMBAT_TEMPLATES,
  SHOP_TEMPLATE,
  START_TEMPLATE,
} from '@/app/modules/level/templates/room.template';
import {
  breakProp,
  arenaLocked,
  bossOf,
  breakPropAt,
  doorOpen,
  hasExitDoor,
  isBossRoom,
  doorsSealed,
  hasLineOfSight,
  isDoorTile,
  isWall,
  moveCircle,
  tileCenter,
} from '@/app/modules/level/utils/grid.util';
import { findPath } from '@/app/modules/level/utils/pathfinding.util';
import { nearbyChest } from '@/app/modules/shop/systems/shop.system';
import {
  AMMO_LOOT_MAX,
  AMMO_LOOT_MIN,
  BOSS_EVERY,
  BOSS_HP_PER_FIGHT,
  BUDDY_CHANCE,
  BUDDY_GAP,
  ENEMY_KINDS,
  FIXED_DT,
  GOLDEN_CHEST_MAX,
  GOLDEN_CHEST_MIN,
  HEADSHOT_FROM_LEVEL,
  HEADSHOT_LOOT_MAX,
  HEADSHOT_LOOT_MIN,
  HEART_MAX,
  HEART_MIN,
  IDLE_WARNING_DELAY,
  INVINCIBILITY_MAX,
  INVINCIBILITY_MIN,
  INVISIBILITY_MAX,
  INVISIBILITY_MIN,
  PLAYER_MAX_HP,
  ROOM_ENEMY_MAX,
  ROOM_H,
  ROOM_W,
  SHIELD_MAX,
  SHIELD_MIN,
  SHOP_EVERY,
} from '@/app/modules/world/constants/world.constants';
import { movePlayer } from '@/app/modules/player/systems/player.system';
import {
  createEmptyWorld,
  createWorld,
} from '@/app/modules/world/systems/world.system';
import type { Enemy, World } from '@/app/modules/world/types/world.types';
import { createArenaWorld } from '@/test/world.fixture';

// inimigos de ronda: fora os guardas de bau, que ficam parados num ponto so
const onPatrol = (world: World) =>
  world.enemies.filter((enemy) => enemy.patrol.length > 1);

const ALL_TEMPLATES = [
  START_TEMPLATE,
  SHOP_TEMPLATE,
  BOSS_TEMPLATE,
  ...COMBAT_TEMPLATES,
];
const DOOR = '####...####';

describe.each(ALL_TEMPLATES)('template $id', (template) => {
  const world = createEmptyWorld(1);
  spawnRoom(world, 0, template);

  it('tem ROOM_H linhas de ROOM_W tiles validos', () => {
    expect(template.tiles).toHaveLength(ROOM_H);
    for (const line of template.tiles) {
      expect(line).toMatch(new RegExp(`^[#.$CoTSBP]{${ROOM_W}}$`));
    }
  });

  it('abre saida e entrada no centro e fecha as laterais', () => {
    expect(template.tiles[0]).toBe(DOOR);
    expect(template.tiles[ROOM_H - 1]).toBe(
      template.kind === 'start' ? '#'.repeat(ROOM_W) : DOOR,
    );
    for (const line of template.tiles) {
      expect(line[0]).toBe('#');
      expect(line[ROOM_W - 1]).toBe('#');
    }
  });

  it('liga a entrada a saida', () => {
    const path = findPath(
      world,
      tileCenter(0, 5, ROOM_H - 2),
      tileCenter(0, 5, 0),
    );
    expect(path.length).toBeGreaterThan(0);
  });

  it('tem patrulhas em chao e conectadas', () => {
    for (const { path } of template.enemies) {
      path.forEach(([col, row], i) => {
        expect(template.tiles[row][col]).not.toBe('#');
        const [nextCol, nextRow] = path[(i + 1) % path.length];
        const route = findPath(
          world,
          tileCenter(0, col, row),
          tileCenter(0, nextCol, nextRow),
        );
        expect(route.length).toBeGreaterThan(0);
      });
    }
  });
});

// anda sala por sala e devolve o template de cada uma
function roomSequence(seed: number, count: number): string[] {
  const world = createWorld(seed);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    world.player.pos.y = i * ROOM_H + 1.5;
    updateRooms(world);
    ids.push(world.rooms.find((r) => r.index === i)!.templateId);
  }
  return ids;
}

describe('geracao de salas', () => {
  it('e deterministica por seed', () => {
    expect(roomSequence(7, 12)).toEqual(roomSequence(7, 12));
    expect(roomSequence(7, 12)).not.toEqual(roomSequence(8, 12));
  });

  it('comeca na sala inicial e poe loja a cada SHOP_EVERY salas', () => {
    const ids = roomSequence(3, SHOP_EVERY * 2 + 1);
    ids.forEach((id, i) => {
      if (i === 0) expect(id).toBe('start');
      else if (i % SHOP_EVERY === 0) expect(id).toBe('shop');
      else expect(id).not.toBe('shop');
    });
  });

  it('mantem so as salas vizinhas e descarta entidades das outras', () => {
    const world = createWorld(5);
    for (let i = 0; i < 6; i++) {
      world.player.pos.y = i * ROOM_H + 1.5;
      updateRooms(world);
    }
    expect(world.rooms.map((r) => r.index)).toEqual([4, 5, 6]);
    expect(world.enemies.every((e) => e.roomIndex >= 4)).toBe(true);
    expect(world.pickups.every((p) => p.roomIndex >= 4)).toBe(true);
    expect(world.run.roomIndex).toBe(5);
  });

  it('cria uma caixa por tile o e copia os tiles do template', () => {
    const open = COMBAT_TEMPLATES.find((t) => t.id === 'open')!;
    const world = createEmptyWorld(1);
    spawnRoom(world, 1, open);
    const crates = open.tiles.join('').split('o').length - 1;
    expect(world.props).toHaveLength(crates);
    expect(world.props.every((p) => !p.broken)).toBe(true);
    expect(world.rooms[0].tiles).not.toBe(open.tiles);
  });

  it('poe mais inimigos em salas avancadas', () => {
    const plaza = COMBAT_TEMPLATES.find((t) => t.id === 'plaza')!;
    const world = createEmptyWorld(1);
    spawnRoom(world, 1, plaza);
    const early = onPatrol(world).length;
    spawnRoom(world, 6, plaza);
    expect(onPatrol(world).length - early).toBeGreaterThan(early);
  });

  // salas de combate de varias seeds: lider e parceiro de cada ronda
  function pairs(room: number) {
    const found: { leader: Enemy; buddy: Enemy }[] = [];
    let rooms = 0;
    for (let seed = 1; seed <= 60; seed++) {
      for (const template of COMBAT_TEMPLATES) {
        const world = createEmptyWorld(seed);
        spawnRoom(world, room, template);
        rooms++;
        for (let i = 0; i + 1 < world.enemies.length; i++) {
          const [leader, buddy] = [world.enemies[i], world.enemies[i + 1]];
          // parceiro nasce logo depois do lider, do mesmo tipo
          if (buddy.id === leader.id + 1 && buddy.kind === leader.kind) {
            found.push({ leader, buddy });
          }
        }
      }
    }
    return { found, rooms };
  }

  it('dupla aparece desde a primeira sala, mas so de vez em quando', () => {
    let alone = 0;
    let paired = 0;
    for (let seed = 1; seed <= 60; seed++) {
      for (const template of COMBAT_TEMPLATES) {
        const world = createEmptyWorld(seed);
        spawnRoom(world, 1, template);
        if (onPatrol(world).length === 1) alone++;
        else paired++;
        expect(onPatrol(world).length).toBeLessThanOrEqual(2);
      }
    }
    expect(paired).toBeGreaterThan(0);
    expect(paired / (alone + paired)).toBeLessThan(0.4);
    expect(BUDDY_CHANCE).toBeLessThan(0.5);
  });

  it('duplas variam: juntas, em sentidos opostos ou em rondas diferentes', () => {
    const { found } = pairs(1);
    const gap = ({ leader, buddy }: (typeof found)[number]) =>
      Math.hypot(buddy.pos.x - leader.pos.x, buddy.pos.y - leader.pos.y);
    const together = found.filter(
      (pair) => Math.abs(gap(pair) - BUDDY_GAP) < 0.01,
    );
    const apart = found.filter((pair) => gap(pair) > 1.5);
    expect(together.length).toBeGreaterThan(0);
    expect(apart.length).toBeGreaterThan(0);
    // juntas dao uma volta maior que o vai e volta de dois pontos
    expect(together.some(({ leader }) => leader.patrol.length > 2)).toBe(true);
    // sentido contrario: comeca na outra ponta da mesma ronda
    expect(
      apart.some(
        ({ leader, buddy }) =>
          buddy.pos.x === leader.patrol.at(-1)!.x &&
          buddy.pos.y === leader.patrol.at(-1)!.y,
      ),
    ).toBe(true);
  });

  it('a sala nunca passa de ROOM_ENEMY_MAX inimigos', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const world = createEmptyWorld(seed);
      for (const template of COMBAT_TEMPLATES) {
        world.enemies = [];
        spawnRoom(world, 300, template);
        expect(world.enemies.length).toBeLessThanOrEqual(ROOM_ENEMY_MAX);
      }
    }
  });
});

describe('grid e caminho', () => {
  const from = { x: 2.5, y: 2.5 };
  const to = { x: 2.5, y: 10.5 };

  it('ve e anda em linha reta na arena aberta', () => {
    const world = createArenaWorld();
    expect(hasLineOfSight(world, from, to)).toBe(true);
    const path = findPath(world, from, to);
    expect(path).toHaveLength(8);
    expect(path[path.length - 1]).toEqual(to);
  });

  it('contorna parede com abertura', () => {
    const world = createArenaWorld({ 6: '########..#' });
    expect(hasLineOfSight(world, from, to)).toBe(false);
    const path = findPath(world, from, to);
    expect(path.some((p) => p.x > 8)).toBe(true);
    expect(path[path.length - 1]).toEqual(to);
  });

  it('caixa bloqueia caminho mas nao visao; quebrada, libera', () => {
    const world = createArenaWorld({ 6: '#ooooooooo#' });
    expect(hasLineOfSight(world, from, to)).toBe(true);
    expect(findPath(world, from, to)).toEqual([]);

    expect(breakPropAt(world, 2.5, 6.5)).toBe(true);
    expect(breakPropAt(world, 2.5, 6.5)).toBe(false);
    expect(findPath(world, from, to)).toHaveLength(8);
  });

  it('mobilia bloqueia caminho mas nao visao, e nao quebra; pilar bloqueia os dois', () => {
    const world = createArenaWorld({ 6: '#TSBTSBTSB#' });
    expect(hasLineOfSight(world, from, to)).toBe(true);
    expect(findPath(world, from, to)).toEqual([]);
    expect(breakPropAt(world, 2.5, 6.5)).toBe(false);
    expect(findPath(world, from, to)).toEqual([]);

    const pillars = createArenaWorld({ 6: '#PPPPPPPPP#' });
    expect(hasLineOfSight(pillars, from, to)).toBe(false);
    expect(findPath(pillars, from, to)).toEqual([]);
  });

  it('devolve vazio sem caminho', () => {
    const world = createArenaWorld({ 6: '###########' });
    expect(findPath(world, from, to)).toEqual([]);
  });
});

it('caixa quebrada as vezes solta coracao ou escudo, dentro das faixas', () => {
  const world = createArenaWorld();
  for (let i = 0; i < 400; i++) {
    breakProp(world, {
      id: i,
      roomIndex: 0,
      pos: { x: 5.5, y: 5.5 },
      broken: false,
    });
  }
  const values = (kind: string) =>
    world.pickups.filter((p) => p.kind === kind).map((p) => p.value);
  const hearts = values('heart');
  const shields = values('shield');
  // nem toda caixa da algo, e sai dos dois tipos
  expect(world.pickups.length).toBeLessThan(300);
  expect(hearts.length).toBeGreaterThan(40);
  expect(shields.length).toBeGreaterThan(40);
  expect(Math.min(...hearts)).toBeGreaterThanOrEqual(PLAYER_MAX_HP * HEART_MIN);
  expect(Math.max(...hearts)).toBeLessThanOrEqual(PLAYER_MAX_HP * HEART_MAX);
  expect(Math.min(...shields)).toBeGreaterThanOrEqual(
    PLAYER_MAX_HP * SHIELD_MIN,
  );
  expect(Math.max(...shields)).toBeLessThanOrEqual(PLAYER_MAX_HP * SHIELD_MAX);
  // cura pouca na maioria das vezes
  const median = [...hearts].sort((a, b) => a - b)[hearts.length >> 1];
  expect(median).toBeLessThan(PLAYER_MAX_HP * 0.3);
});

it('caixa quebrada tambem solta saltos, de 1 a 6, todos os valores saem', () => {
  const world = createArenaWorld();
  for (let i = 0; i < 600; i++) {
    breakProp(world, {
      id: i,
      roomIndex: 0,
      pos: { x: 5.5, y: 5.5 },
      broken: false,
    });
  }
  const dashes = world.pickups
    .filter((p) => p.kind === 'dash')
    .map((p) => p.value);
  expect(dashes.length).toBeGreaterThan(60);
  expect([...new Set(dashes)].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  // ainda sobra caixa vazia
  expect(world.pickups.length).toBeLessThan(600);
});

describe('porta da sala inicial', () => {
  // sala inicial (0) e a seguinte (1): a porta fica no vao do fundo da sala 0
  function doorWorld() {
    const world = createWorld(7);
    world.enemies = [];
    return world;
  }
  const inside = { x: 5.5, y: ROOM_H - 2.5 };
  // tile de entrada da sala 1: sempre aberto
  const beyond = { x: 5.5, y: ROOM_H + 0.5 };

  it('fica no vao de saida da sala inicial e de cada loja', () => {
    for (const col of [4, 5, 6]) {
      expect(isDoorTile(col, ROOM_H - 1)).toBe(true);
      expect(isDoorTile(col, (SHOP_EVERY + 1) * ROOM_H - 1)).toBe(true);
      // sala de combate nao tem porta
      expect(isDoorTile(col, 2 * ROOM_H - 1)).toBe(false);
    }
    expect(isDoorTile(3, ROOM_H - 1)).toBe(false);
    expect(isDoorTile(5, ROOM_H - 2)).toBe(false);
  });

  it('sela enquanto o player se mexe e libera depois de parado demais', () => {
    const world = doorWorld();
    expect(doorsSealed(world)).toBe(true);

    world.run.seconds = IDLE_WARNING_DELAY;
    expect(doorsSealed(world)).toBe(false);

    world.run.lastMovedAt = world.run.seconds;
    expect(doorsSealed(world)).toBe(true);
  });

  it('selada, nao ha rota nem passagem; liberada, ha', () => {
    const world = doorWorld();
    expect(findPath(world, beyond, inside, true)).toEqual([]);
    expect(findPath(world, beyond, inside).length).toBeGreaterThan(0);

    const walker = { ...beyond };
    for (let i = 0; i < 200; i++)
      moveCircle(world, walker, 0, -0.05, 0.35, true);
    expect(walker.y).toBeGreaterThan(ROOM_H);

    for (let i = 0; i < 200; i++) moveCircle(world, walker, 0, -0.05, 0.35);
    expect(walker.y).toBeLessThan(ROOM_H - 1);
  });

  it('fechada segura flecha e visao; aberta para o player, deixa passar', () => {
    const world = doorWorld();
    const door = { x: 5.5, y: ROOM_H - 0.5 };
    // player longe: porta fechada
    world.player.pos = { x: 5.5, y: 2.5 };
    expect(doorOpen(world, ROOM_H - 1)).toBe(false);
    expect(isWall(world, door.x, door.y)).toBe(true);
    expect(hasLineOfSight(world, inside, beyond)).toBe(false);

    // player chegou perto: abre
    world.player.pos = { ...inside };
    expect(doorOpen(world, ROOM_H - 1)).toBe(true);
    expect(isWall(world, door.x, door.y)).toBe(false);
    expect(hasLineOfSight(world, inside, beyond)).toBe(true);
  });

  it('so abre para inimigo com a porta liberada', () => {
    const world = doorWorld();
    world.player.pos = { x: 5.5, y: 2.5 };
    world.enemies.push(createEnemy(world, 1, [beyond], 'archer'));
    world.enemies[0].pos = { ...beyond };
    expect(doorOpen(world, ROOM_H - 1)).toBe(false);

    world.run.seconds = IDLE_WARNING_DELAY;
    expect(doorOpen(world, ROOM_H - 1)).toBe(true);
  });

  it('quem ja esta no vao quando a porta sela consegue sair', () => {
    const world = doorWorld();
    const stuck = { x: 5.5, y: ROOM_H - 0.5 };
    moveCircle(world, stuck, 0, 0.2, 0.35, true);
    expect(stuck.y).toBeCloseTo(ROOM_H - 0.3);
  });
});

describe('moveCircle', () => {
  const RADIUS = 0.35;

  it('encosta na parede e desliza nela, sem sobrar vao', () => {
    const world = createArenaWorld({ 6: '###########' });
    const pos = { x: 3.5, y: 4.5 };
    for (let i = 0; i < 60; i++) moveCircle(world, pos, 0.04, 0.05, RADIUS);
    // parede ocupa y de 6 a 7
    expect(pos.y).toBeCloseTo(6 - RADIUS);
    expect(pos.x).toBeCloseTo(3.5 + 60 * 0.04);
  });

  it('contorna a quina e entra em corredor de 1 tile mesmo desalinhado', () => {
    const world = createArenaWorld({ 6: '#####.#####' });
    // vao em x de 5 a 6; o circulo so cabe com o centro entre 5.35 e 5.65
    for (const x of [5.1, 5.85]) {
      const pos = { x, y: 4.5 };
      for (let i = 0; i < 80; i++) moveCircle(world, pos, 0, 0.05, RADIUS);
      expect(pos.y).toBeGreaterThan(7.4);
      expect(pos.x).toBeGreaterThanOrEqual(5 + RADIUS - 1e-6);
      expect(pos.x).toBeLessThanOrEqual(6 - RADIUS + 1e-6);
    }
  });

  it('nao atravessa parede nem em passo grande', () => {
    const world = createArenaWorld({ 6: '###########' });
    const pos = { x: 5.5, y: 4.5 };
    moveCircle(world, pos, 0, 5, RADIUS);
    expect(pos.y).toBeCloseTo(6 - RADIUS);
  });
});

describe('municao em caixa', () => {
  function loot(armed: boolean) {
    const world = createArenaWorld();
    if (armed) world.player.weapon = { id: 'bow', ammo: 1 };
    for (let i = 0; i < 800; i++) {
      breakProp(world, {
        id: i,
        roomIndex: 0,
        pos: { x: 5.5, y: 5.5 },
        broken: false,
      });
    }
    return world.pickups.filter((p) => p.kind === 'ammo').map((p) => p.value);
  }

  it('so sai com o player armado', () => {
    expect(loot(false)).toHaveLength(0);
    expect(loot(true).length).toBeGreaterThan(60);
  });

  it('vem de AMMO_LOOT_MIN a AMMO_LOOT_MAX flechas', () => {
    const values = loot(true);
    expect(Math.min(...values)).toBe(AMMO_LOOT_MIN);
    expect(Math.max(...values)).toBe(AMMO_LOOT_MAX);
  });
});

describe('item de mira em caixa', () => {
  // 800 caixas quebradas na sala `roomIndex`
  function loot(roomIndex: number, armed: boolean) {
    const world = createArenaWorld();
    if (armed) world.player.arsenal.push({ id: 'bow', ammo: 0 });
    for (let i = 0; i < 800; i++) {
      breakProp(world, {
        id: i,
        roomIndex,
        pos: { x: 5.5, y: 5.5 },
        broken: false,
      });
    }
    return world.pickups
      .filter((p) => p.kind === 'headshot')
      .map((p) => p.value);
  }
  // primeira sala do nivel HEADSHOT_FROM_LEVEL
  const from = (HEADSHOT_FROM_LEVEL - 1) * SHOP_EVERY + 1;

  it('so sai a partir do nivel 3, e so com arma de alcance', () => {
    expect(loot(from - 1, true)).toHaveLength(0);
    expect(loot(from, false)).toHaveLength(0);
    expect(loot(from, true).length).toBeGreaterThan(20);
  });

  it('vem de HEADSHOT_LOOT_MIN a HEADSHOT_LOOT_MAX pontos', () => {
    const values = loot(from, true);
    expect(Math.min(...values)).toBe(HEADSHOT_LOOT_MIN);
    expect(Math.max(...values)).toBe(HEADSHOT_LOOT_MAX);
  });
});

describe('bau dourado', () => {
  it('chance vai de GOLDEN_CHEST_MIN a GOLDEN_CHEST_MAX, subindo por sala e contrato', () => {
    expect(goldenChestChance(1)).toBe(GOLDEN_CHEST_MIN);
    expect(goldenChestChance(2)).toBeGreaterThan(goldenChestChance(1));
    expect(goldenChestChance(SHOP_EVERY + 1)).toBeGreaterThan(
      goldenChestChance(1),
    );
    expect(goldenChestChance(500)).toBe(GOLDEN_CHEST_MAX);
  });

  it('nasce em sala de combate na frequencia da chance, no maximo um por sala', () => {
    const world = createEmptyWorld(7);
    const rooms = 2000;
    for (let i = 0; i < rooms; i++) spawnRoom(world, 1, COMBAT_TEMPLATES[0]);
    const golden = world.props.filter((prop) => prop.golden).length;
    expect(golden / rooms).toBeGreaterThan(GOLDEN_CHEST_MIN - 0.02);
    expect(golden / rooms).toBeLessThan(GOLDEN_CHEST_MIN + 0.02);
    spawnRoom(world, 0, START_TEMPLATE);
    spawnRoom(world, SHOP_EVERY, SHOP_TEMPLATE);
    expect(
      world.props.some((prop) => prop.golden && prop.roomIndex !== 1),
    ).toBe(false);
  });

  it('solta um dos quatro premios: vida e escudo cheios, tempo sorteado', () => {
    const full = { heart: PLAYER_MAX_HP, shield: PLAYER_MAX_HP * SHIELD_MAX };
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const world = createArenaWorld();
      world.rngState = i + 1;
      breakProp(world, {
        id: i,
        roomIndex: 0,
        pos: { x: 5.5, y: 5.5 },
        broken: false,
        golden: true,
      });
      for (const pickup of world.pickups) {
        if (pickup.kind === 'invisibility') {
          expect(pickup.value).toBeGreaterThanOrEqual(INVISIBILITY_MIN);
          expect(pickup.value).toBeLessThanOrEqual(INVISIBILITY_MAX);
        } else if (pickup.kind === 'invincibility') {
          expect(pickup.value).toBeGreaterThanOrEqual(INVINCIBILITY_MIN);
          expect(pickup.value).toBeLessThanOrEqual(INVINCIBILITY_MAX);
        } else {
          expect(pickup.value).toBe(full[pickup.kind as keyof typeof full]);
        }
      }
      seen.add(
        world.pickups
          .map((pickup) => pickup.kind)
          .sort()
          .join('+'),
      );
    }
    expect([...seen].sort()).toEqual([
      'heart+invisibility',
      'heart+shield',
      'invincibility',
      'shield',
    ]);
  });
});

describe('brute da besta', () => {
  it('aparece menos que archer e knight, e nunca sozinho na ronda', () => {
    const count = { archer: 0, knight: 0, brute: 0, boss: 0 };
    for (let seed = 1; seed <= 80; seed++) {
      for (const template of COMBAT_TEMPLATES) {
        const world = createEmptyWorld(seed);
        spawnRoom(world, 12, template);
        const patrols = onPatrol(world);
        for (const enemy of patrols) count[enemy.kind]++;
        expect(patrols.filter((e) => e.kind === 'brute').length % 2).toBe(0);
      }
    }
    expect(count.brute).toBeGreaterThan(0);
    expect(count.brute).toBeLessThan(count.knight);
    expect(count.brute).toBeLessThan(count.archer);
  });

  it('dupla guarda o bau da loja e o bau dourado, colada nele', () => {
    const shop = createEmptyWorld(1);
    spawnRoom(shop, SHOP_EVERY, SHOP_TEMPLATE);
    const chest = shop.rooms[0].chest!;
    expect(shop.enemies.map((e) => e.kind)).toEqual(['brute', 'brute']);
    for (const guard of shop.enemies) {
      expect(Math.hypot(guard.pos.x - chest.x, guard.pos.y - chest.y)).toBe(1);
    }

    let golden = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const world = createEmptyWorld(seed);
      spawnRoom(world, 1, COMBAT_TEMPLATES[0]);
      const guards = world.enemies.filter((e) => e.patrol.length === 1);
      const gold = world.props.find((prop) => prop.golden);
      expect(guards.length).toBe(gold ? 2 : 0);
      for (const guard of guards) {
        expect(guard.kind).toBe('brute');
        expect(
          Math.hypot(guard.pos.x - gold!.pos.x, guard.pos.y - gold!.pos.y),
        ).toBe(1);
      }
      if (gold) golden++;
    }
    expect(golden).toBeGreaterThan(0);
  });
});

describe('chefe', () => {
  // primeira arena: ultima sala antes do mercador da cacada BOSS_EVERY
  const arena = BOSS_EVERY * SHOP_EVERY - 1;

  it('a arena e a ultima sala antes do mercador, a cada BOSS_EVERY cacadas', () => {
    const arenas = Array.from({ length: 60 }, (_, i) => i).filter(isBossRoom);
    expect(arenas[0]).toBe(arena);
    expect(arenas[1] - arenas[0]).toBe(BOSS_EVERY * SHOP_EVERY);
    for (const index of arenas) expect((index + 1) % SHOP_EVERY).toBe(0);
    expect(isBossRoom(0)).toBe(false);
  });

  it('a arena usa a sala propria e tem so o chefe dentro', () => {
    const world = createEmptyWorld(3);
    const template = pickTemplate(world, arena);
    expect(template.kind).toBe('boss');
    spawnRoom(world, arena, template);
    expect(world.enemies.map((enemy) => enemy.kind)).toEqual(['boss']);
    expect(world.props).toHaveLength(0);
    expect(world.rooms[0].kind).toBe('boss');
  });

  it('a sala antes da arena tem dois baus de compra sem guarda, um de cada lado da porta', () => {
    for (const template of COMBAT_TEMPLATES) {
      const world = createEmptyWorld(1);
      spawnRoom(world, arena - 1, template);
      const room = world.rooms[0];
      const row = (arena - 1) * ROOM_H + ROOM_H - 2 + 0.5;
      expect(room.chest).toEqual({ x: 3.5, y: row });
      expect(room.sideChest).toEqual({ x: 7.5, y: row });
      // parados num ponto so = guarda de bau; so o do bau dourado pode haver
      const golden = world.props.some((prop) => prop.golden);
      expect(world.enemies.filter((e) => e.patrol.length === 1)).toHaveLength(
        golden ? 2 : 0,
      );
      // os dois abrem a loja, e a porta continua alcancavel
      world.player.pos = { x: 7.5, y: row - 1 };
      expect(nearbyChest(world)).toBe(room);
      expect(
        findPath(
          world,
          tileCenter(arena - 1, 5, ROOM_H - 2),
          tileCenter(arena - 1, 5, 0),
        ).length,
      ).toBeGreaterThan(0);
    }
    // sala de combate comum: nenhum bau
    const plain = createEmptyWorld(1);
    spawnRoom(plain, 1, COMBAT_TEMPLATES[0]);
    expect(plain.rooms[0].chest).toBeNull();
    expect(plain.rooms[0].sideChest).toBeNull();
  });

  it('a vida do chefe cresce a cada chefe ja enfrentado', () => {
    expect(bossMaxHp(arena)).toBe(ENEMY_KINDS.boss.hp);
    const next = arena + BOSS_EVERY * SHOP_EVERY;
    expect(bossMaxHp(next)).toBe(
      Math.round(ENEMY_KINDS.boss.hp * (1 + BOSS_HP_PER_FIGHT)),
    );
    const world = createEmptyWorld(3);
    spawnRoom(world, next, BOSS_TEMPLATE);
    expect(world.enemies[0].hp).toBe(bossMaxHp(next));
  });

  it('tem porta na entrada e na saida da arena, alem das de sempre', () => {
    expect(hasExitDoor(arena - 1)).toBe(true);
    expect(hasExitDoor(arena)).toBe(true);
    expect(hasExitDoor(0)).toBe(true);
    expect(hasExitDoor(1)).toBe(false);
    // vao do meio da ultima linha da sala anterior: a entrada da arena
    expect(isDoorTile(Math.floor(ROOM_W / 2), arena * ROOM_H - 1)).toBe(true);
  });

  it('quem entra fica trancado ate o chefe cair: portas fecham e viram parede', () => {
    const world = createEmptyWorld(3);
    spawnRoom(world, arena, BOSS_TEMPLATE);
    const entrance = arena * ROOM_H - 1;
    const exit = (arena + 1) * ROOM_H - 1;
    // do lado de fora, colado na porta: ela abre
    world.player.pos = { x: ROOM_W / 2, y: entrance - 0.5 };
    expect(arenaLocked(world, arena)).toBe(false);
    expect(doorOpen(world, entrance)).toBe(true);

    // dentro: tranca as duas, mesmo com o player colado nelas
    world.player.pos = { x: ROOM_W / 2, y: entrance + 1.5 };
    expect(arenaLocked(world, arena)).toBe(true);
    expect(doorOpen(world, entrance)).toBe(false);
    world.player.pos = { x: ROOM_W / 2, y: exit - 0.6 };
    expect(doorOpen(world, exit)).toBe(false);
    // nao atravessa a saida
    for (let i = 0; i < 120; i++) {
      movePlayer(world, { moveX: 0, moveY: 1, dash: false }, FIXED_DT);
    }
    expect(world.player.pos.y).toBeLessThan(exit);

    // chefe morto: destranca
    bossOf(world, arena)!.state = 'dead';
    expect(arenaLocked(world, arena)).toBe(false);
    expect(doorOpen(world, exit)).toBe(true);
    for (let i = 0; i < 120; i++) {
      movePlayer(world, { moveX: 0, moveY: 1, dash: false }, FIXED_DT);
    }
    expect(world.player.pos.y).toBeGreaterThan(exit);
  });

  it('entrar na arena acorda o chefe em alerta', () => {
    const world = createEmptyWorld(3);
    spawnRoom(world, arena - 1, COMBAT_TEMPLATES[0]);
    spawnRoom(world, arena, BOSS_TEMPLATE);
    world.enemies = world.enemies.filter((enemy) => enemy.kind === 'boss');
    world.run.roomIndex = arena - 1;
    world.player.pos = { x: ROOM_W / 2, y: arena * ROOM_H + 0.6 };
    updateRooms(world);
    expect(bossOf(world, arena)!.detection).toBe(1);
    expect(world.run.events.at(-1)?.text).toContain('chefe');
  });
});
