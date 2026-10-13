// O cenario deste jogo montado com o kit: que peca faz cada coisa e em que
// tamanho. O kit e o KayKit Dungeon Pack (public/models/kaykit/dungeon.glb,
// scripts/pack-kaykit-dungeon.mjs); as pecas tem que estar no arquivo
// (tests/dungeon.assets.test.ts confere). Para desligar: `url` em null, e o
// cenario volta a ser o de caixas e papel de parede.

export type Placed = { piece: string; scale: number };

export const SCENERY: {
  url: string | null;
  floor: Placed;
  wall: { piece: string; length: number; height: number };
  props: Placed[];
  chest: Placed & { lid: string };
  goldenChest: Placed;
  money: Placed;
  door: { piece: string; leaf: string; width: number; height: number };
  // mobilia fixa e pilar, pela letra do tile no template (`isFurniture` e
  // 'P' em grid.util). `height`: altura da peca no kit, esticada ate a da
  // parede do jogo. Sem isto, ou sem a peca, sai uma caixa no lugar
  furniture?: Record<string, Placed & { height?: number }>;
  // Decoracao: so desenho, nao bloqueia nem entra na simulacao. Tudo opcional.
  // ladrilhos diferentes espalhados pelo chao (mesmo tamanho do `floor`)
  floorVariants?: string[];
  // tocha presa na face da parede virada para a camera
  torch?: Placed;
  // estandartes na parede do fundo; a cor muda por nivel, e a primeira e a
  // da arena do chefe
  banners?: string[];
} = {
  url: '/models/kaykit/dungeon.glb',
  // ladrilho de 2 x 2 no kit: metade da um tile
  floor: { piece: 'floor_tile_small', scale: 0.5 },
  // meio muro: `length` de comprido (em x, a partir da origem), `height` de
  // alto e 1 de grosso. Vira um bloco de 1 tile, na altura de parede do jogo
  wall: { piece: 'wall_half', length: 2, height: 4 },
  // objetos quebraveis: a aparencia sai do id, como antes. Cada um no
  // tamanho que cabe num tile sem encostar nos vizinhos
  props: [
    { piece: 'box_large', scale: 0.52 },
    { piece: 'crates_stacked', scale: 0.36 },
    { piece: 'barrel_large', scale: 0.42 },
    { piece: 'keg', scale: 0.4 },
  ],
  // bau da loja e de revive; `lid` e o no da tampa, que gira para abrir
  chest: { piece: 'chest', scale: 0.55, lid: 'chest_lid' },
  goldenChest: { piece: 'chest_gold', scale: 0.5 },
  money: { piece: 'coin_stack_small', scale: 0.5 },
  // porta de correr: duas folhas de madeira. `leaf` e o no da folha dentro da
  // peca; `width` e `height` sao o tamanho dela no kit (a origem fica na
  // dobradica, `hinge` para dentro da folha)
  door: {
    piece: 'wall_doorway',
    leaf: 'wall_doorway_door',
    width: 2,
    height: 2.75,
  },
  // cada uma no tamanho que cabe num tile; o jogo centra a peca no tile e
  // poe o pe dela no chao (a estante do kit e de pendurar)
  furniture: {
    T: { piece: 'table_medium_decorated_A', scale: 0.45 },
    S: { piece: 'shelves', scale: 0.46 },
    B: { piece: 'barrel_small_stack', scale: 0.5 },
    P: { piece: 'pillar', scale: 0.6, height: 4 },
  },
  floorVariants: [
    'floor_tile_small_broken_A',
    'floor_tile_small_broken_B',
    'floor_tile_small_weeds_A',
  ],
  torch: { piece: 'torch_mounted', scale: 0.7 },
  banners: ['banner_red', 'banner_blue', 'banner_green'],
};
