import {
  pickTemplate,
  updateRooms,
} from '@/app/modules/level/systems/level.system';
import { nextTutorialStep } from '@/app/modules/tutorial/systems/tutorial.system';
import {
  FIXED_DT,
  ROOM_H,
  setTutorial,
  TUTORIAL_BOSS_ROOM,
} from '@/app/modules/world/constants/world.constants';
import {
  createWorld,
  stepWorld,
} from '@/app/modules/world/systems/world.system';
import { addEnemy, createArenaWorld } from '@/test/world.fixture';

describe('tutorial', () => {
  it('cada passo so avanca quando o mundo mostra a acao', () => {
    const world = createArenaWorld();
    world.status = 'intro';
    world.run.checkpoint = { ...world.player.pos };
    expect(nextTutorialStep(world, 'welcome')).toBe('welcome');

    world.status = 'playing';
    expect(nextTutorialStep(world, 'welcome')).toBe('move');

    world.player.pos.y += 1;
    expect(nextTutorialStep(world, 'move')).toBe('move');
    world.player.pos.y += 2;
    expect(nextTutorialStep(world, 'move')).toBe('crouch');

    world.player.crouching = true;
    expect(nextTutorialStep(world, 'crouch')).toBe('dash');

    world.player.dash = 0.2;
    expect(nextTutorialStep(world, 'dash')).toBe('door');

    world.run.roomIndex = 1;
    expect(nextTutorialStep(world, 'door')).toBe('kill');

    world.run.kills = 1;
    expect(nextTutorialStep(world, 'kill')).toBe('loot');

    world.player.money = 10;
    expect(nextTutorialStep(world, 'loot')).toBe('arena');

    world.run.roomIndex = TUTORIAL_BOSS_ROOM;
    expect(nextTutorialStep(world, 'arena')).toBe('boss');

    const boss = addEnemy(world, 5, 5, 0, 'boss');
    expect(nextTutorialStep(world, 'boss')).toBe('boss');
    boss.state = 'dead';
    expect(nextTutorialStep(world, 'boss')).toBe('done');
    expect(nextTutorialStep(world, 'done')).toBe('done');
  });

  it('pula varios passos de uma vez quando ja estao cumpridos', () => {
    const world = createArenaWorld();
    world.run.roomIndex = 1;
    world.run.kills = 1;
    world.player.money = 5;
    expect(nextTutorialStep(world, 'door')).toBe('arena');
  });
});

describe('mundo do tutorial', () => {
  afterEach(() => setTutorial(false));

  it('tem sala inicial, uma de combate com um arqueiro e a arena do chefe', () => {
    setTutorial(true);
    const world = createWorld(7);
    // a sala 2 ja nasce junto quando o player entra na 1
    world.player.pos.y += ROOM_H;
    updateRooms(world);
    const kinds = world.rooms.map((room) => room.kind);
    expect(kinds).toEqual(['start', 'combat', 'boss']);
    const room1 = world.enemies.filter((enemy) => enemy.roomIndex === 1);
    expect(room1.map((enemy) => enemy.kind)).toEqual(['archer']);
    expect(world.enemies.some((enemy) => enemy.kind === 'boss')).toBe(true);
    // depois da arena, so sala vazia
    expect(pickTemplate(world, 3).kind).toBe('start');
  });

  it('ninguem morre: a vida volta cheia no lugar da derrota', () => {
    setTutorial(true);
    const world = createWorld(7);
    world.player.hp = 0;
    stepWorld(world, { moveX: 0, moveY: 0, dash: false }, FIXED_DT);
    expect(world.status).toBe('playing');
    expect(world.player.hp).toBe(world.player.maxHp);
  });
});
