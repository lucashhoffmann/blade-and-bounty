import { ITEMS } from '@/app/modules/shop/constants/shop.constants';
import { createEnemy } from '@/app/modules/enemy/systems/enemy.system';
import {
  FIXED_DT,
  IDLE_WARNING_DELAY,
  PLAYER_MAX_HP,
  ROOM_H,
} from '@/app/modules/world/constants/world.constants';
import {
  DEFAULT_BLOOD_COLOR,
  DEFAULT_GRAPHICS,
  DEFAULT_LOOK,
  getWorld,
  LOOK_SCALE,
  useGameStore,
  WEAPON_SCALE,
  OUTFIT_IDS,
} from '@/app/store/game-store/game.store';
import {
  BLADE_IDS,
  bladePrice,
  outfitPrice,
} from '@/app/modules/skins/constants/skins.constants';
import {
  credit,
  readWallet,
  restoreWallet,
  saveWallet,
} from '@/app/store/game-store/wallet';

const IDLE = { moveX: 0, moveY: 0, dash: false };
const FORWARD = { moveX: 0, moveY: 1, dash: false };
const store = () => useGameStore.getState();

// run ja passada da legenda inicial
function play() {
  store().startRun(1);
  store().begin();
}

beforeEach(() => {
  store().backToMenu();
  useGameStore.setState({
    best: 0,
    look: DEFAULT_LOOK,
    bloodColor: DEFAULT_BLOOD_COLOR,
    intelligence: {},
    attackVariance: null,
  });
});

describe('game store', () => {
  it('startRun cria o mundo e abre na legenda, sem simular', () => {
    store().startRun(1);
    expect(store().screen).toBe('intro');
    expect(store().hud.hp).toBe(PLAYER_MAX_HP);

    const y = getWorld()!.player.pos.y;
    store().tick(FORWARD, FIXED_DT);
    expect(getWorld()!.player.pos.y).toBe(y);
  });

  it('begin sai da legenda para playing', () => {
    store().startRun(1);
    store().begin();
    expect(store().screen).toBe('playing');
  });

  it('togglePause congela e retoma', () => {
    play();
    store().togglePause();
    expect(store().screen).toBe('paused');

    const y = getWorld()!.player.pos.y;
    store().tick(FORWARD, FIXED_DT);
    expect(getWorld()!.player.pos.y).toBe(y);

    store().togglePause();
    expect(store().screen).toBe('playing');
  });

  it('tick avanca a simulacao e sincroniza o hud', () => {
    play();
    const startY = getWorld()!.player.pos.y;
    getWorld()!.player.money = 80;

    store().tick(FORWARD, FIXED_DT);

    expect(getWorld()!.player.pos.y).toBeGreaterThan(startY);
    expect(store().hud.money).toBe(80);
  });

  it('nao notifica a UI quando nada visivel mudou', () => {
    play();
    const listener = vi.fn();
    const unsubscribe = useGameStore.subscribe(listener);

    for (let i = 0; i < 30; i++) store().tick(IDLE, FIXED_DT);

    unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });

  it('publica o aviso de inatividade e o zera na proxima run', () => {
    play();
    for (let i = 0; i < (IDLE_WARNING_DELAY + FIXED_DT) / FIXED_DT; i++) {
      store().tick(IDLE, FIXED_DT);
    }

    expect(store().idleWarnings).toBe(1);
    expect(
      JSON.parse(localStorage.getItem('blade-and-bounty')!).state.idleWarnings,
    ).toBeUndefined();

    store().startRun(2);
    expect(store().idleWarnings).toBe(0);
  });

  it('buy debita, mostra a arma no hud e publica o mercado novo', () => {
    play();
    getWorld()!.player.money = 300;
    const market = store().market;

    store().buy('bow');

    expect(store().hud.weaponId).toBe('bow');
    expect(store().hud.ammo).toBe(ITEMS.bow.ammo);
    expect(store().hud.money).toBe(300 - ITEMS.bow.price);
    expect(store().market).not.toBe(market);
    expect(store().market.prices.bow).toBeGreaterThan(ITEMS.bow.price);
  });

  it('closeShop volta para playing', () => {
    play();
    getWorld()!.status = 'shop';
    useGameStore.setState({ screen: 'shop' });

    store().closeShop();

    expect(store().screen).toBe('playing');
  });

  it('morte vai para gameover e para de simular', () => {
    play();
    getWorld()!.player.hp = 0;

    store().tick(IDLE, FIXED_DT);
    expect(store().screen).toBe('gameover');

    const y = getWorld()!.player.pos.y;
    store().tick(FORWARD, FIXED_DT);
    expect(getWorld()!.player.pos.y).toBe(y);
  });

  it('guarda a maior sala alcancada em best', () => {
    play();
    getWorld()!.player.pos.y = 3 * ROOM_H + 1.5;

    store().tick(IDLE, FIXED_DT);

    expect(store().hud.room).toBe(3);
    expect(store().best).toBe(3);
  });

  it('backToMenu descarta o mundo e mantem best', () => {
    useGameStore.setState({ best: 7 });
    play();

    store().backToMenu();

    expect(store().screen).toBe('menu');
    expect(getWorld()).toBeNull();
    expect(store().best).toBe(7);
  });

  it('setLook no menu muda cor e prende a escala na faixa', () => {
    store().setLook({ cloth: '#00ff00', head: 99, legs: -1 });

    expect(store().look.cloth).toBe('#00ff00');
    expect(store().look.head).toBe(LOOK_SCALE.max);
    expect(store().look.legs).toBe(LOOK_SCALE.min);
  });

  it('setLook ignora cor invalida', () => {
    store().setLook({ skin: 'red' });
    expect(store().look.skin).toBe(DEFAULT_LOOK.skin);
  });

  it('grava a cor do sangue e rejeita cor invalida', () => {
    store().setBloodColor('#22aa44');
    expect(store().bloodColor).toBe('#22aa44');
    expect(
      JSON.parse(localStorage.getItem('blade-and-bounty')!).state.bloodColor,
    ).toBe('#22aa44');
    store().setBloodColor('verde');
    expect(store().bloodColor).toBe('#22aa44');
  });

  it('salva a opção dos corvos e aceita gráficos antigos sem ela', async () => {
    store().setGraphics({ crows: false });
    expect(
      JSON.parse(localStorage.getItem('blade-and-bounty')!).state.graphics
        .crows,
    ).toBe(false);

    useGameStore.setState({ graphics: DEFAULT_GRAPHICS });
    localStorage.setItem(
      'blade-and-bounty',
      JSON.stringify({
        state: { graphics: { quality: 'low', blur: false } },
        version: 0,
      }),
    );
    await useGameStore.persist.rehydrate();
    expect(store().graphics).toEqual({
      quality: 'low',
      blur: false,
      crows: true,
    });
  });

  it('salva os perfis de inteligencia em JSON e os reutiliza em outra run', () => {
    play();
    createEnemy(getWorld()!, 26, [{ x: 5.5, y: 5.5 }]);
    store().tick(IDLE, FIXED_DT);

    const profile = store().intelligence[6];
    expect(profile).toBeDefined();
    expect(profile.hearingThreshold).toBeGreaterThan(0.6);
    expect(
      JSON.parse(localStorage.getItem('blade-and-bounty')!).state
        .intelligence[6],
    ).toEqual(profile);

    store().backToMenu();
    store().startRun(2);
    expect(getWorld()!.intelligence[6]).toEqual(profile);
  });

  it('salva a variacao de ataque em JSON e reutiliza a faixa', () => {
    play();
    const variance = getWorld()!.run.attackVariance;
    expect(variance.min).toBeGreaterThanOrEqual(1);
    expect(variance.max).toBeLessThanOrEqual(1.5);
    expect(
      JSON.parse(localStorage.getItem('blade-and-bounty')!).state
        .attackVariance,
    ).toEqual(variance);

    store().backToMenu();
    store().startRun(2);
    expect(getWorld()!.run.attackVariance).toEqual(variance);
  });

  it('descarta faixa de ataque invalida do localStorage', async () => {
    localStorage.setItem(
      'blade-and-bounty',
      JSON.stringify({
        state: { attackVariance: { min: -1, max: 99 } },
        version: 0,
      }),
    );
    await useGameStore.persist.rehydrate();
    expect(store().attackVariance).toBeNull();
  });

  it('descarta perfis de inteligencia invalidos do localStorage', async () => {
    localStorage.setItem(
      'blade-and-bounty',
      JSON.stringify({
        state: {
          intelligence: {
            6: { hearing: 1.5, pursuit: 1.4, dash: 1.3 },
            7: { hearing: 99, pursuit: 1, dash: 1 },
            8: { hearing: 'alto', pursuit: 1, dash: 1 },
            9: { hearing: 1.5, hearingThreshold: 2, pursuit: 1.4, dash: 1.3 },
            10: {
              hearing: 1.5,
              hearingThreshold: null,
              pursuit: 1.4,
              dash: 1.3,
            },
          },
        },
        version: 0,
      }),
    );
    await useGameStore.persist.rehydrate();
    expect(store().intelligence).toEqual({
      6: { hearing: 1.5, hearingThreshold: 1, pursuit: 1.4, dash: 1.3 },
    });
  });

  it('openCharacter abre a tela de personagem, onde setLook ainda vale', () => {
    store().openCharacter();
    store().setLook({ cloth: '#00ff00' });

    expect(store().screen).toBe('character');
    expect(store().look.cloth).toBe('#00ff00');
  });

  it('openCharacter nao tira o jogador de uma run', () => {
    play();
    store().openCharacter();
    expect(store().screen).toBe('playing');
  });

  it('setLook nao muda nada depois que a run comeca', () => {
    store().startRun(1);
    store().setLook({ cloth: '#00ff00' });
    expect(store().look.cloth).toBe(DEFAULT_LOOK.cloth);
  });
});

it('setLook aceita tamanho da arma dentro da faixa propria', () => {
  const { setLook } = useGameStore.getState();
  setLook({ weapon: 0.5 });
  expect(useGameStore.getState().look.weapon).toBe(0.5);
  setLook({ weapon: 0.1 });
  expect(useGameStore.getState().look.weapon).toBe(WEAPON_SCALE.min);
  setLook({ weapon: 1 });
});

it('skin: so veste a que a carteira tem; save antigo ganha a padrao', () => {
  const store = () => useGameStore.getState();
  // nao comprou: nao veste
  store().setLook({ outfit: 'mage' });
  expect(store().look.outfit).toBe(DEFAULT_LOOK.outfit);
  // valor que nao existe (save adulterado) nao entra
  store().setLook({ outfit: 'dragon' as never });
  expect(store().look.outfit).toBe(DEFAULT_LOOK.outfit);

  // look salvo antes de existir a escolha
  const old: Partial<typeof DEFAULT_LOOK> = { ...DEFAULT_LOOK };
  delete old.outfit;
  useGameStore.setState({ look: old as typeof DEFAULT_LOOK });
  store().setLook({ weapon: 1 });
  expect(store().look.outfit).toBe(DEFAULT_LOOK.outfit);
});

it('hud avisa quando ha perseguicao: algum inimigo em alerta', () => {
  const store = () => useGameStore.getState();
  store().startRun(1);
  store().begin();
  const step = () => store().tick({ moveX: 0, moveY: 0, dash: false }, 1 / 60);
  step();
  expect(store().hud.chased).toBe(false);

  const enemy = getWorld()!.enemies[0];
  enemy.state = 'alert';
  enemy.alertTimer = 5;
  step();
  expect(store().hud.chased).toBe(true);

  enemy.state = 'dead';
  step();
  expect(store().hud.chased).toBe(false);
});

// selo de antes das skins de arma: o mesmo calculo de wallet.ts, sem a
// lista de armas
const legacySeal = (rubies: number, owned: string[]) => {
  const text = `b&b:wallet:7f3a91|${rubies}|${[...owned].sort().join(',')}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
};

describe('loja de skins', () => {
  const store = () => useGameStore.getState();
  beforeEach(() => {
    restoreWallet(null);
    useGameStore.setState({ ...readWallet(), look: DEFAULT_LOOK });
  });

  it('compra com saldo: desconta o preco fixo, guarda a skin e ja veste', () => {
    useGameStore.setState(credit(10));
    expect(store().buyOutfit('rogue')).toBe(true);
    expect(store().rubies).toBe(10 - outfitPrice('rogue'));
    expect(store().owned).toContain('rogue');
    expect(store().look.outfit).toBe('rogue');
    // ja tem: nao cobra de novo
    expect(store().buyOutfit('rogue')).toBe(false);
    expect(store().rubies).toBe(10 - outfitPrice('rogue'));
  });

  it('sem saldo nao compra nem veste', () => {
    useGameStore.setState(credit(1));
    expect(store().buyOutfit('knight')).toBe(false);
    expect(store().rubies).toBe(1);
    expect(store().owned).not.toContain('knight');
    expect(store().look.outfit).toBe(DEFAULT_LOOK.outfit);
  });

  it('trava: mudar o saldo ou a lista de skins pelo estado nao vale', () => {
    useGameStore.setState({ rubies: 9999 });
    expect(store().rubies).toBe(0);
    expect(store().buyOutfit('skeletonWarrior')).toBe(false);

    useGameStore.setState({ owned: [...OUTFIT_IDS] });
    expect(store().owned).toEqual([DEFAULT_LOOK.outfit]);
    // nem vestir direto o que nao comprou
    useGameStore.setState({
      look: { ...DEFAULT_LOOK, outfit: 'skeletonWarrior' },
    });
    expect(store().look.outfit).toBe(DEFAULT_LOOK.outfit);
  });

  it('trava: carteira salva com valor editado perde o selo e zera', () => {
    credit(5);
    const saved = saveWallet();
    expect(restoreWallet(saved)).toEqual({
      rubies: 5,
      owned: ['rogueHooded'],
      blades: ['sword'],
    });
    // saldo editado no armazenamento local
    expect(restoreWallet({ ...saved, rubies: 500 }).rubies).toBe(0);
    // skin acrescentada a mao
    expect(
      restoreWallet({ ...saved, owned: [...saved.owned, 'knight'] }).owned,
    ).toEqual(['rogueHooded']);
    // lixo
    expect(restoreWallet('x').rubies).toBe(0);
    expect(restoreWallet({ rubies: -3, owned: [], seal: '' }).rubies).toBe(0);
  });

  it('skin de arma: compra, veste, e as travas valem para ela tambem', () => {
    useGameStore.setState(credit(bladePrice('staff')));
    expect(store().buyBlade('staff')).toBe(true);
    expect(store().rubies).toBe(0);
    expect(store().blades).toEqual(['sword', 'staff']);
    expect(store().look.blade).toBe('staff');
    // nao comprou: nao leva na mao
    store().setLook({ blade: 'greataxe' });
    expect(store().look.blade).toBe('staff');
    // mudar a lista ou a arma vestida pelo estado nao vale
    useGameStore.setState({ blades: [...BLADE_IDS] });
    expect(store().blades).toEqual(['sword', 'staff']);
    useGameStore.setState({ look: { ...store().look, blade: 'greataxe' } });
    expect(store().look.blade).toBe('sword');
  });

  it('carteira salva antes das skins de arma continua valendo', () => {
    credit(4);
    const saved: Partial<ReturnType<typeof saveWallet>> = saveWallet();
    delete saved.blades;
    // o selo antigo nao levava as armas: recalcula como era
    saved.seal = legacySeal(saved.rubies!, saved.owned!);
    expect(restoreWallet(saved)).toEqual({
      rubies: 4,
      owned: ['rogueHooded'],
      blades: ['sword'],
    });
  });

  it('moeda vermelha pega na partida entra no saldo; editar o numero da partida nao', () => {
    store().startRun(1);
    store().begin();
    const world = getWorld()!;
    world.enemies = [];
    const step = () =>
      store().tick({ moveX: 0, moveY: 0, dash: false }, 1 / 60);
    // uma moeda de verdade, em cima do player
    world.pickups.push({
      id: 9001,
      kind: 'ruby',
      roomIndex: 0,
      pos: { ...world.player.pos },
      value: 1,
    });
    step();
    expect(store().rubies).toBe(1);
    expect(store().hud.rubies).toBe(1);

    // pelo inspetor: aumentar o contador da partida, ou plantar mais moedas
    // na mesma sala (o teto dela ja foi pago)
    world.run.rubies = 500;
    for (let i = 0; i < 20; i++) {
      world.pickups.push({
        id: 9100 + i,
        kind: 'ruby',
        roomIndex: 0,
        pos: { ...world.player.pos },
        value: 50,
      });
    }
    step();
    expect(store().rubies).toBe(1);
  });
});
