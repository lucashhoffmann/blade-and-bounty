import { createEnemy } from '@/app/modules/enemy/systems/enemy.system';
import {
  BOSS_TEMPLATE,
  COMBAT_TEMPLATES,
  SHOP_TEMPLATE,
  START_TEMPLATE,
} from '@/app/modules/level/templates/room.template';
import {
  MULTI_BOSS_TEMPLATE,
  MULTI_COMBAT_TEMPLATES,
  MULTI_SHOP_TEMPLATE,
  MULTI_START_TEMPLATE,
} from '@/app/modules/multiplayer/templates/room.template';
import {
  enemyMultiplier,
  threatBoost,
} from '@/app/modules/world/utils/players.util';
import {
  bossOf,
  circleHitsWall,
  isBossRoom,
  isFurniture,
  roomIndexAt,
  tileCenter,
} from '@/app/modules/level/utils/grid.util';
import {
  BOSS_EVERY,
  BOSS_HP_PER_FIGHT,
  BUDDY_CHANCE,
  ENEMY_KINDS,
  BUDDY_GAP,
  ENEMY_RADIUS,
  BRUTE_CHANCE,
  BRUTE_FROM_ROOM,
  GOLDEN_CHEST_MAX,
  GOLDEN_CHEST_MIN,
  GOLDEN_CHEST_PER_CONTRACT,
  GOLDEN_CHEST_PER_ROOM,
  KNIGHT_CHANCE,
  KNIGHT_FROM_ROOM,
  ROOM_ENEMY_MAX,
  ROOM_W,
  ROOMS_AHEAD,
  ROOMS_BEHIND,
  ROOMS_PER_EXTRA_ENEMY,
  SHOP_EVERY,
  TILE_MONEY,
  isTutorial,
} from '@/app/modules/world/constants/world.constants';
import type {
  EnemyKind,
  RoomTemplate,
  Vec2,
  World,
} from '@/app/modules/world/types/world.types';
import { nextRandom } from '@/shared/utils/rng.util';
import { eventText } from '@/shared/i18n';

// cada modo tem as proprias salas, no tamanho dele
const TEMPLATES = {
  solo: {
    start: START_TEMPLATE,
    shop: SHOP_TEMPLATE,
    boss: BOSS_TEMPLATE,
    combat: COMBAT_TEMPLATES,
  },
  multi: {
    start: MULTI_START_TEMPLATE,
    shop: MULTI_SHOP_TEMPLATE,
    boss: MULTI_BOSS_TEMPLATE,
    combat: MULTI_COMBAT_TEMPLATES,
  },
};

export function pickTemplate(world: World, index: number): RoomTemplate {
  const { start, shop, boss, combat } = TEMPLATES[world.mode];
  if (index === 0) return start;
  if (isBossRoom(index)) return boss;
  // tutorial: sala 1 e sempre a mesma; depois da arena so sala vazia
  if (isTutorial()) return index === 1 ? combat[0] : start;
  if (index % SHOP_EVERY === 0) return shop;
  return combat[Math.floor(nextRandom(world) * combat.length)];
}

// A mesma ronda, deslocada BUDDY_GAP para um lado em que todos os pontos
// caem em chao livre; null se nao cabe de lado nenhum.
function buddyPatrol(world: World, patrol: Vec2[]): Vec2[] | null {
  for (const [dx, dy] of [
    [BUDDY_GAP, 0],
    [-BUDDY_GAP, 0],
    [0, BUDDY_GAP],
    [0, -BUDDY_GAP],
  ]) {
    const beside = patrol.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }));
    if (
      beside.every(
        (point) => !circleHitsWall(world, point.x, point.y, ENEMY_RADIUS),
      )
    ) {
      return beside;
    }
  }
  return null;
}

// Dupla de brutes de guarda no bau em `spot`: cada um parado num tile livre
// colado nele, de costas para o bau. Sem tile livre, sem guarda.
function spawnGuards(world: World, index: number, spot: Vec2): void {
  const posts = [
    [0, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
  ]
    .map(([dx, dy]) => ({ x: spot.x + dx, y: spot.y + dy }))
    .filter((post) => !circleHitsWall(world, post.x, post.y, ENEMY_RADIUS));
  for (const post of posts.slice(0, 2)) {
    const guard = createEnemy(world, index, [post], 'brute');
    guard.facing = Math.atan2(post.y - spot.y, post.x - spot.x);
    world.enemies.push(guard);
  }
}

// chance de a sala `index` ter bau dourado: cresce pela posicao da sala no
// contrato e pelo contrato, de GOLDEN_CHEST_MIN a GOLDEN_CHEST_MAX
export function goldenChestChance(index: number): number {
  return Math.min(
    GOLDEN_CHEST_MAX,
    GOLDEN_CHEST_MIN +
      ((index - 1) % SHOP_EVERY) * GOLDEN_CHEST_PER_ROOM +
      Math.floor((index - 1) / SHOP_EVERY) * GOLDEN_CHEST_PER_CONTRACT,
  );
}

// vida cheia do chefe da arena `index`: cresce a cada chefe ja enfrentado
export function bossMaxHp(index: number): number {
  const fights = Math.floor(Math.ceil(index / SHOP_EVERY) / BOSS_EVERY) - 1;
  return Math.round(
    ENEMY_KINDS.boss.hp * (1 + Math.max(0, fights) * BOSS_HP_PER_FIGHT),
  );
}

// caixas, mobilia e dinheiro marcados no template
function spawnProps(world: World, index: number, template: RoomTemplate): void {
  template.tiles.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      if (line[col] === 'o' || isFurniture(line[col])) {
        world.props.push({
          id: world.nextId++,
          roomIndex: index,
          pos: tileCenter(index, col, row),
          broken: false,
          ...(line[col] === 'o' ? {} : { furniture: line[col] }),
        });
      }
      if (line[col] !== '$') continue;
      world.pickups.push({
        id: world.nextId++,
        kind: 'money',
        roomIndex: index,
        pos: tileCenter(index, col, row),
        value: TILE_MONEY,
      });
    }
  });
}

export function spawnRoom(
  world: World,
  index: number,
  template: RoomTemplate = pickTemplate(world, index),
): void {
  // Antes da arena do chefe: dois baus de compra colados na parede do fundo,
  // um de cada lado da porta, sem guarda. E a chance de se preparar
  const armory =
    template.kind === 'combat' && isBossRoom(index + 1) && !isTutorial();
  const tiles = [...template.tiles];
  if (armory) {
    const middle = Math.floor(ROOM_W / 2);
    tiles[1] = [...tiles[1]]
      .map((tile, col) =>
        Math.abs(col - middle) === 2 && tile === '.' ? 'C' : tile,
      )
      .join('');
  }
  const chestRow = tiles.findIndex((line) => line.includes('C'));
  const chestCol = chestRow < 0 ? -1 : tiles[chestRow].indexOf('C');
  const sideCol = chestRow < 0 ? -1 : tiles[chestRow].lastIndexOf('C');
  const reviveRow = template.tiles.findIndex((line) => line.includes('R'));
  world.rooms.push({
    index,
    templateId: template.id,
    kind: template.kind,
    // copia: quebrar caixa edita os tiles desta sala, nao do template
    tiles,
    chest: chestRow < 0 ? null : tileCenter(index, chestCol, chestRow),
    sideChest:
      sideCol === chestCol ? null : tileCenter(index, sideCol, chestRow),
    shopVisited: false,
    reviveChest:
      reviveRow < 0
        ? null
        : tileCenter(index, template.tiles[reviveRow].indexOf('R'), reviveRow),
    reviveFree: true,
  });

  // arena: so o chefe, mais forte a cada um ja enfrentado
  if (template.kind === 'boss') {
    const boss = createEnemy(
      world,
      index,
      template.enemies[0].path.map(([col, row]) => tileCenter(index, col, row)),
      'boss',
    );
    boss.hp = bossMaxHp(index);
    world.enemies.push(boss);
    return;
  }

  const route = (i: number) =>
    template.enemies[i].path.map(([col, row]) => tileCenter(index, col, row));
  // multiplayer: mais inimigos por sala e dificuldade adiantada
  const threat = index + threatBoost(world);
  const enemyCount = Math.min(
    template.enemies.length,
    Math.round(
      (1 + Math.floor(threat / ROOMS_PER_EXTRA_ENEMY)) * enemyMultiplier(world),
    ),
  );
  // tutorial: um arqueiro sozinho, para aprender o golpe pelas costas
  if (isTutorial()) {
    if (template.enemies.length > 0) {
      world.enemies.push(createEnemy(world, index, route(0), 'archer'));
    }
    spawnProps(world, index, template);
    return;
  }
  // rondas do template que sobraram: viram o caminho extra das duplas
  const spare = template.enemies
    .slice(enemyCount)
    .map((_, i) => route(enemyCount + i));
  let spawned = 0;
  for (let i = 0; i < enemyCount && spawned < ROOM_ENEMY_MAX; i++) {
    const patrol = route(i);
    const kind: EnemyKind =
      threat >= BRUTE_FROM_ROOM && nextRandom(world) < BRUTE_CHANCE
        ? 'brute'
        : threat >= KNIGHT_FROM_ROOM && nextRandom(world) < KNIGHT_CHANCE
          ? 'knight'
          : 'archer';
    const leader = createEnemy(world, index, patrol, kind);
    world.enemies.push(leader);
    spawned++;
    if (spawned >= ROOM_ENEMY_MAX) break;
    // brute nunca anda sozinho
    if (kind !== 'brute' && nextRandom(world) >= BUDDY_CHANCE) continue;
    // Parceiro. Cada dupla se comporta de um jeito, por sorteio:
    const style = nextRandom(world);
    let path: Vec2[] | null = null;
    if (style < 1 / 3) {
      // juntos, lado a lado, dando uma volta maior: a ronda emendada numa
      // das que sobraram (o lider passa a fazer a mesma volta)
      const tour = spare.length ? [...patrol, ...spare[0]] : patrol;
      path = buddyPatrol(world, tour);
      if (path && spare.length) {
        spare.shift();
        leader.patrol = tour;
      } else if (!path) {
        path = buddyPatrol(world, patrol);
      }
    } else if (style < 2 / 3 && spare.length) {
      // separados: o parceiro cuida de outra ronda da sala
      path = spare.shift()!;
    }
    // sentido contrario na mesma ronda: os dois se cruzam no meio. Tambem e
    // o que sobra quando nao cabe lado a lado ou nao ha outra ronda
    path ??= [...patrol].reverse();
    world.enemies.push(createEnemy(world, index, path, kind));
    spawned++;
  }

  spawnProps(world, index, template);

  // bau da loja tem guarda
  const chest = world.rooms[world.rooms.length - 1].chest;
  if (chest && !armory) spawnGuards(world, index, chest);

  // bau dourado: uma das caixas da sala de combate, as vezes; com guarda
  if (template.kind !== 'combat') return;
  if (nextRandom(world) >= goldenChestChance(index)) return;
  const crates = world.props.filter(
    (prop) => prop.roomIndex === index && !prop.furniture,
  );
  const crate = crates[Math.floor(nextRandom(world) * crates.length)];
  if (!crate) return;
  crate.golden = true;
  spawnGuards(world, index, crate.pos);
}

// mantem vivas so as salas ao redor do player; o resto vira parede
export function updateRooms(world: World): void {
  const current = roomIndexAt(world.player.pos.y);
  if (current > world.run.roomIndex) {
    // entrada da sala nova: e onde renasce quem morrer nela com ficha
    world.run.checkpoint = { ...world.player.pos };
    world.run.events.push({
      at: world.run.seconds,
      ...eventText((t) => t.events.roomReached(current)),
    });
    // entrou na arena: o chefe ja acorda em alerta
    const boss = bossOf(world, current);
    if (boss) {
      boss.detection = 1;
      world.run.events.push({
        at: world.run.seconds,
        ...eventText((t) => t.events.bossAwake),
      });
    }
  }
  world.run.roomIndex = Math.max(world.run.roomIndex, current);

  let last = world.rooms[world.rooms.length - 1].index;
  while (last < current + ROOMS_AHEAD) spawnRoom(world, ++last);

  const min = current - ROOMS_BEHIND;
  if (world.rooms[0].index >= min) return;
  world.rooms = world.rooms.filter((r) => r.index >= min);
  world.enemies = world.enemies.filter((e) => e.roomIndex >= min);
  world.pickups = world.pickups.filter((p) => p.roomIndex >= min);
  world.props = world.props.filter((p) => p.roomIndex >= min);
}
