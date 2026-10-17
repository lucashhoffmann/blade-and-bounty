import {
  angleTo,
  castRay as castRayOnGrid,
  circleHitsTiles,
  distance,
  moveCircle as moveCircleOnGrid,
  nextRandom,
} from 'three-hex-engine/kit';

import {
  HEADSHOT_FROM_LEVEL,
  HEADSHOT_LOOT_MAX,
  HEADSHOT_LOOT_MIN,
  HEART_MAX,
  AMMO_LOOT_MAX,
  AMMO_LOOT_MIN,
  DASH_LOOT_MAX,
  DASH_LOOT_MIN,
  DOOR_RANGE,
  HEART_MIN,
  IDLE_WARNING_DELAY,
  INVINCIBILITY_MAX,
  INVINCIBILITY_MIN,
  INVISIBILITY_MAX,
  INVISIBILITY_MIN,
  LOOT_HEART_CHANCE,
  LOOT_AMMO_CHANCE,
  LOOT_DASH_CHANCE,
  LOOT_REVIVE_CHANCE,
  LOOT_HEADSHOT_CHANCE,
  LOOT_SHIELD_CHANCE,
  MELEE_RANGE,
  ROOM_H,
  ROOM_W,
  RUBY_GOLDEN_CHANCE,
  RUBY_LOOT_CHANCE,
  BOSS_EVERY,
  BOSS_INVISIBILITY,
  BOSS_SHIELD,
  SHOP_EVERY,
  SHIELD_MAX,
  SHIELD_MIN,
  isTutorial,
  TUTORIAL_BOSS_ROOM,
} from '@/app/modules/world/constants/world.constants';
import type {
  Enemy,
  Pickup,
  PickupKind,
  Prop,
  Vec2,
  World,
} from '@/app/modules/world/types/world.types';

const RAY_STEP = 0.1;

function roomAt(world: World, ty: number) {
  const index = Math.floor(ty / ROOM_H);
  return world.rooms.find((r) => r.index === index);
}

// fora das salas vivas tudo e parede
export function tileAt(world: World, tx: number, ty: number): string {
  if (tx < 0 || tx >= ROOM_W) return '#';
  const room = roomAt(world, ty);
  if (!room) return '#';
  return room.tiles[ROOM_H - 1 - (ty - room.index * ROOM_H)][tx];
}

// parede ('#') bloqueia tudo. Caixa ('o') bloqueia passagem e flecha, mas e
// baixa: nao bloqueia visao. Bau ('C') bloqueia igual a caixa e nao quebra.
export function isSolidTile(tile: string): boolean {
  // bau de revive ('R') e igual ao da loja
  return (
    tile === '#' ||
    tile === 'o' ||
    tile === 'C' ||
    tile === 'R' ||
    tile === 'P' ||
    isFurniture(tile)
  );
}

// Mobilia: mesa ('T'), estante ('S') e barris de enfeite ('B'). E um `Prop`
// como a caixa: bloqueia passagem e flecha, nao visao, e quebra igual; so nao
// solta item. O pilar ('P') e estrutura: na simulacao e igual a parede.
export function isFurniture(tile: string): boolean {
  return tile === 'T' || tile === 'S' || tile === 'B';
}

// parede, pilar ou porta fechada: seguram flecha e visao
export function isWall(world: World, x: number, y: number): boolean {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const tile = tileAt(world, tx, ty);
  return (
    tile === '#' || tile === 'P' || (isDoorTile(tx, ty) && !doorOpen(world, ty))
  );
}

export function roomIndexAt(y: number): number {
  return Math.floor(y / ROOM_H);
}

// (col, row) do template para o centro do tile em coordenadas de mundo
export function tileCenter(roomIndex: number, col: number, row: number): Vec2 {
  return { x: col + 0.5, y: roomIndex * ROOM_H + (ROOM_H - 1 - row) + 0.5 };
}

// Arena do chefe: a ultima sala antes do mercador, a cada BOSS_EVERY cacadas.
export function isBossRoom(index: number): boolean {
  // tutorial: a arena e a terceira sala, e a unica
  if (isTutorial()) return index === TUTORIAL_BOSS_ROOM;
  return (
    index > 0 &&
    index % SHOP_EVERY === SHOP_EVERY - 1 &&
    Math.ceil(index / SHOP_EVERY) % BOSS_EVERY === 0
  );
}

// A saida da sala `index` tem porta de correr: sala inicial e mercador (a
// entrada de cada nivel), a sala antes da arena do chefe (a entrada dela) e
// a propria arena (a saida).
export function hasExitDoor(index: number): boolean {
  return index % SHOP_EVERY === 0 || isBossRoom(index + 1) || isBossRoom(index);
}

// Porta de correr: fica no vao de saida (3 colunas do meio da linha do fundo)
// das salas de `hasExitDoor`.
export function isDoorTile(tx: number, ty: number): boolean {
  return (
    // vao de 3 tiles no meio da parede; a largura da sala muda por modo
    Math.abs(tx - Math.floor(ROOM_W / 2)) <= 1 &&
    ty % ROOM_H === ROOM_H - 1 &&
    hasExitDoor(Math.floor(ty / ROOM_H))
  );
}

// chefe vivo da sala `index`, se ela e arena e ele ainda esta de pe
export function bossOf(world: World, index: number): Enemy | undefined {
  return world.enemies.find(
    (enemy) =>
      enemy.kind === 'boss' &&
      enemy.roomIndex === index &&
      enemy.state !== 'dead',
  );
}

// Arena trancada: com o chefe vivo e alguem dentro, as duas portas dela
// fecham e viram parede para o player ate ele morrer.
export function arenaLocked(world: World, index: number): boolean {
  return (
    !!bossOf(world, index) &&
    world.players.some(
      (player) => player.hp > 0 && roomIndexAt(player.pos.y) === index,
    )
  );
}

// A porta nao abre para inimigo enquanto o player se mexe. Parado por
// IDLE_WARNING_DELAY (a mesma espera que manda inimigos atras dele), ela
// libera; voltou a andar, sela de novo.
export function doorsSealed(world: World): boolean {
  return world.run.seconds - world.run.lastMovedAt < IDLE_WARNING_DELAY;
}

// Porta da linha `ty` aberta: player por perto, ou porta liberada e inimigo
// vivo por perto. Fechada, segura flecha e visao (`isWall`); a engine desenha
// as folhas pelo mesmo criterio.
export function doorOpen(world: World, ty: number): boolean {
  // a porta da linha `ty` e a saida da sala `index` e a entrada da seguinte
  const index = Math.floor(ty / ROOM_H);
  if (arenaLocked(world, index) || arenaLocked(world, index + 1)) return false;
  const reaches = (pos: Vec2) =>
    Math.abs(pos.y - ty) < DOOR_RANGE &&
    Math.abs(pos.x - ROOM_W / 2) < DOOR_RANGE;
  return (
    world.players.some((player) => player.hp > 0 && reaches(player.pos)) ||
    (!doorsSealed(world) &&
      world.enemies.some((e) => e.state !== 'dead' && reaches(e.pos)))
  );
}

// `sealed`: porta conta como parede (movimento de inimigo com a porta selada)
export function circleHitsWall(
  world: World,
  x: number,
  y: number,
  radius: number,
  sealed = false,
): boolean {
  return circleHitsTiles(x, y, radius, solidAt(world, sealed));
}

// tile que segura corpo: solido, ou porta quando selada
function solidAt(world: World, sealed: boolean) {
  return (tx: number, ty: number) =>
    isSolidTile(tileAt(world, tx, ty)) || (sealed && isDoorTile(tx, ty));
}

// Anda e depois resolve a colisao (kit da engine): encosta na parede,
// desliza nela e contorna quina, em vez de travar.
export function moveCircle(
  world: World,
  pos: Vec2,
  dx: number,
  dy: number,
  radius: number,
  sealed = false,
): void {
  // quem ja esta no vao quando a porta sela nao fica preso: pode sair
  const blocked = sealed && !isDoorTile(Math.floor(pos.x), Math.floor(pos.y));
  moveCircleOnGrid(pos, dx, dy, radius, solidAt(world, blocked));
}

export function castRay(
  world: World,
  from: Vec2,
  angle: number,
  maxDist: number,
): number {
  return castRayOnGrid(
    from,
    angle,
    maxDist,
    (x, y) => isWall(world, x, y),
    RAY_STEP,
  );
}

export function hasLineOfSight(world: World, a: Vec2, b: Vec2): boolean {
  const d = distance(a, b);
  return castRay(world, a, angleTo(a, b), d) >= d;
}

export function nearbyProp(world: World): Prop | undefined {
  const from = world.player.pos;
  let nearest: Prop | undefined;
  let nearestDistance = MELEE_RANGE;
  for (const prop of world.props) {
    if (prop.broken) continue;
    const d = distance(from, prop.pos);
    if (d <= nearestDistance && hasLineOfSight(world, from, prop.pos)) {
      nearest = prop;
      nearestDistance = d;
    }
  }
  return nearest;
}

// Tabela de saque da caixa. Um sorteio escolhe a faixa (cada item ocupa
// `chance` da reta de 0 a 1; o que sobra e caixa vazia) e outro, `roll`, define
// o valor. Tudo pelo `rngState`: reproduzivel por seed.
// Item novo entra no fim, para nao trocar o que as faixas anteriores soltam.
// onde o saque cai: a caixa quebrada, ou o lugar onde o inimigo morreu
type LootSpot = { roomIndex: number; pos: Vec2 };

const LOOT: {
  kind: PickupKind;
  chance: number;
  value: (world: World, roll: number) => number;
  // so sai quando isso vale; senao a faixa dele conta como caixa vazia
  when?: (world: World, at: LootSpot) => boolean;
}[] = [
  {
    // cura pouca na maioria das vezes: `roll` ao quadrado puxa para baixo
    kind: 'heart',
    chance: LOOT_HEART_CHANCE,
    value: (world, roll) =>
      Math.round(
        world.player.maxHp *
          (HEART_MIN + (HEART_MAX - HEART_MIN) * roll * roll),
      ),
  },
  {
    kind: 'shield',
    chance: LOOT_SHIELD_CHANCE,
    value: (world, roll) =>
      Math.round(
        world.player.maxHp * (SHIELD_MIN + (SHIELD_MAX - SHIELD_MIN) * roll),
      ),
  },
  {
    // inteiro de DASH_LOOT_MIN a DASH_LOOT_MAX, todos com a mesma chance
    kind: 'dash',
    chance: LOOT_DASH_CHANCE,
    value: (_world, roll) =>
      DASH_LOOT_MIN + Math.floor(roll * (DASH_LOOT_MAX - DASH_LOOT_MIN + 1)),
  },
  {
    kind: 'revive',
    chance: LOOT_REVIVE_CHANCE,
    value: () => 1,
  },
  {
    // flecha so serve para quem tem arma de alcance
    kind: 'ammo',
    chance: LOOT_AMMO_CHANCE,
    when: (world) =>
      world.player.weapon !== null || world.player.arsenal.length > 0,
    value: (_world, roll) =>
      AMMO_LOOT_MIN + Math.floor(roll * (AMMO_LOOT_MAX - AMMO_LOOT_MIN + 1)),
  },
  {
    // mira: so para quem tem arma de alcance, em caixa do nivel
    // HEADSHOT_FROM_LEVEL em diante (nivel = contrato)
    kind: 'headshot',
    chance: LOOT_HEADSHOT_CHANCE,
    when: (world, at) =>
      (world.player.weapon !== null || world.player.arsenal.length > 0) &&
      Math.floor((at.roomIndex - 1) / SHOP_EVERY) + 1 >= HEADSHOT_FROM_LEVEL,
    value: (_world, roll) =>
      HEADSHOT_LOOT_MIN +
      Math.floor(roll * (HEADSHOT_LOOT_MAX - HEADSHOT_LOOT_MIN + 1)),
  },
  {
    // moeda vermelha: rara, e so no solo (o saldo e de quem joga sozinho)
    kind: 'ruby',
    chance: RUBY_LOOT_CHANCE,
    when: (world) => world.mode === 'solo',
    value: () => 1,
  },
];

// Sorteia a tabela e, se sair item, larga em `at`. Usado pela caixa quebrada
// e pelo inimigo morto (combat.system): os dois soltam as mesmas coisas.
export function dropLoot(world: World, at: LootSpot): void {
  let roll = nextRandom(world);
  for (const loot of LOOT) {
    if (roll < loot.chance) {
      if (loot.when && !loot.when(world, at)) return;
      world.pickups.push({
        id: world.nextId++,
        kind: loot.kind,
        roomIndex: at.roomIndex,
        pos: { ...at.pos },
        value: loot.value(world, nextRandom(world)),
      });
      return;
    }
    roll -= loot.chance;
  }
}

// larga os premios lado a lado em volta de `at`, para todos aparecerem
function placePrizes(
  world: World,
  at: LootSpot,
  prizes: Pick<Pickup, 'kind' | 'value' | 'over'>[],
): void {
  prizes.forEach((prize, i) => {
    world.pickups.push({
      id: world.nextId++,
      ...prize,
      roomIndex: at.roomIndex,
      pos: { x: at.pos.x + (i - (prizes.length - 1) / 2) * 0.4, y: at.pos.y },
    });
  });
}

// Premio do chefe: os tres de uma vez, e maiores que os do bau dourado. Vida
// cheia, escudo de BOSS_SHIELD da vida maxima (acima do teto normal) e
// BOSS_INVISIBILITY segundos de invisibilidade. Sem sorteio.
export function dropBossPrize(world: World, at: LootSpot): void {
  const maxHp = Math.max(...world.players.map((player) => player.maxHp));
  placePrizes(world, at, [
    { kind: 'heart', value: maxHp },
    { kind: 'shield', value: Math.round(maxHp * BOSS_SHIELD), over: true },
    { kind: 'invisibility', value: BOSS_INVISIBILITY },
  ]);
}

// Premio do bau dourado, um de quatro com a mesma chance: invisibilidade +
// vida cheia, escudo cheio, vida cheia + escudo cheio, ou invencibilidade.
// "Cheio" e pela maior vida maxima do grupo; o teto de quem coleta corta o
// excesso. Invisibilidade e invencibilidade duram um tempo sorteado.
export function dropGolden(world: World, at: LootSpot): void {
  const maxHp = Math.max(...world.players.map((player) => player.maxHp));
  const heart = { kind: 'heart', value: maxHp } as const;
  const shield = {
    kind: 'shield',
    value: Math.round(maxHp * SHIELD_MAX),
  } as const;
  // decimos de segundo, de `min` a `max`
  const seconds = (min: number, max: number) =>
    Math.round((min + (max - min) * nextRandom(world)) * 10) / 10;
  const sets: (() => { kind: PickupKind; value: number }[])[] = [
    () => [
      {
        kind: 'invisibility',
        value: seconds(INVISIBILITY_MIN, INVISIBILITY_MAX),
      },
      heart,
    ],
    () => [shield],
    () => [heart, shield],
    () => [
      {
        kind: 'invincibility',
        value: seconds(INVINCIBILITY_MIN, INVINCIBILITY_MAX),
      },
    ],
  ];
  placePrizes(world, at, sets[Math.floor(nextRandom(world) * sets.length)]());
  // as vezes, uma moeda vermelha junto, um pouco a frente do premio
  if (world.mode === 'solo' && nextRandom(world) < RUBY_GOLDEN_CHANCE) {
    dropRubies(world, at, 1);
  }
}

// `count` moedas vermelhas em volta de `at` (bau dourado, chefe)
export function dropRubies(world: World, at: LootSpot, count: number): void {
  for (let i = 0; i < count; i++) {
    world.pickups.push({
      id: world.nextId++,
      kind: 'ruby',
      roomIndex: at.roomIndex,
      pos: {
        x: at.pos.x + (i - (count - 1) / 2) * 0.4,
        y: at.pos.y - 0.35,
      },
      value: 1,
    });
  }
}

// quebrar libera o tile: a sala guarda a propria copia de `tiles`
export function breakProp(world: World, prop: Prop): void {
  if (prop.broken) return;
  prop.broken = true;
  if (prop.golden) dropGolden(world, prop);
  else if (!prop.furniture) dropLoot(world, prop);
  const tx = Math.floor(prop.pos.x);
  const ty = Math.floor(prop.pos.y);
  const room = roomAt(world, ty);
  if (!room) return;
  const row = ROOM_H - 1 - (ty - room.index * ROOM_H);
  const line = room.tiles[row];
  room.tiles[row] = line.slice(0, tx) + '.' + line.slice(tx + 1);
}

// devolve true se havia caixa inteira no ponto (e ela quebrou)
export function breakPropAt(world: World, x: number, y: number): boolean {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const tile = tileAt(world, tx, ty);
  if (tile !== 'o' && !isFurniture(tile)) return false;
  const prop = world.props.find(
    (p) =>
      !p.broken && Math.floor(p.pos.x) === tx && Math.floor(p.pos.y) === ty,
  );
  if (prop) breakProp(world, prop);
  return true;
}

export function breakPropsNear(world: World, pos: Vec2, radius: number): void {
  for (const prop of world.props) {
    if (distance(prop.pos, pos) <= radius) breakProp(world, prop);
  }
}
