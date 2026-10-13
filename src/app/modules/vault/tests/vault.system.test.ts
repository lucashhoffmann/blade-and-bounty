import { collectPickups } from '@/app/modules/combat/systems/combat.system';
import { BOSS_TEMPLATE } from '@/app/modules/level/templates/room.template';
import { spawnRoom } from '@/app/modules/level/systems/level.system';
import {
  claimRuby,
  takeRubies,
} from '@/app/modules/vault/systems/vault.system';
import {
  RUBY_BOSS_CAP,
  RUBY_ROOM_CAP,
} from '@/app/modules/world/constants/world.constants';
import { createEmptyWorld } from '@/app/modules/world/systems/world.system';
import type { World } from '@/app/modules/world/types/world.types';
import { createArenaWorld } from '@/test/world.fixture';

// moeda vermelha em cima do player
function plant(world: World, count: number, roomIndex = 0) {
  for (let i = 0; i < count; i++) {
    world.pickups.push({
      id: world.nextId++,
      kind: 'ruby',
      roomIndex,
      pos: { ...world.player.pos },
      value: 1,
    });
  }
}

describe('cofre das moedas vermelhas', () => {
  it('paga a moeda pega, uma vez, e entrega ao saldo so o que pagou', () => {
    const world = createArenaWorld();
    plant(world, 1);
    collectPickups(world);
    expect(world.pickups).toHaveLength(0);
    expect(world.run.rubies).toBe(1);
    expect(takeRubies(world)).toBe(1);
    // ja levado: nao paga de novo
    expect(takeRubies(world)).toBe(0);
  });

  it('cada sala paga ate o teto: moeda a mais some sem valer', () => {
    const world = createArenaWorld();
    plant(world, RUBY_ROOM_CAP + 10);
    collectPickups(world);
    expect(world.pickups).toHaveLength(0);
    expect(world.run.rubies).toBe(RUBY_ROOM_CAP);
    expect(takeRubies(world)).toBe(RUBY_ROOM_CAP);
    // plantar de novo na mesma sala nao adianta
    plant(world, 5);
    collectPickups(world);
    expect(takeRubies(world)).toBe(0);
  });

  it('o valor escrito na moeda e o contador da partida nao mudam o que e pago', () => {
    const world = createArenaWorld();
    plant(world, 1);
    world.pickups[0].value = 999;
    collectPickups(world);
    world.run.rubies = 999;
    expect(takeRubies(world)).toBe(1);
  });

  it('so paga sala que existe agora, e so no solo', () => {
    const world = createArenaWorld();
    expect(claimRuby(world, 42)).toBe(false);
    world.mode = 'multi';
    expect(claimRuby(world, 0)).toBe(false);
    expect(takeRubies(world)).toBe(0);
  });

  it('a arena do chefe tem teto maior', () => {
    const world = createEmptyWorld(1);
    spawnRoom(world, 9, BOSS_TEMPLATE);
    let paid = 0;
    for (let i = 0; i < RUBY_BOSS_CAP + 5; i++) {
      if (claimRuby(world, 9)) paid++;
    }
    expect(paid).toBe(RUBY_BOSS_CAP);
    expect(RUBY_BOSS_CAP).toBeGreaterThan(RUBY_ROOM_CAP);
  });

  it('partida nova comeca com o cofre zerado', () => {
    const first = createArenaWorld();
    plant(first, 1);
    collectPickups(first);
    const second = createArenaWorld();
    expect(takeRubies(second)).toBe(0);
    plant(second, 1);
    collectPickups(second);
    expect(takeRubies(second)).toBe(1);
  });
});
