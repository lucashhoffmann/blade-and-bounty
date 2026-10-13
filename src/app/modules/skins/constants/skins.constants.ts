// Skins do player: os personagens do kit, comprados com moeda vermelha na
// loja da tela inicial.
//
// O PRECO E FIXO. Ele sai de quantas horas de jogo a skin deve custar,
// convertidas em moedas por RUBIES_PER_HOUR. Nao muda com o tempo, com o
// saldo nem com o que o jogador ja comprou.
//
// De onde vem RUBIES_PER_HOUR (estimativa; world.constants tem as chances):
//   uma hora rende perto de 50 salas (morrer e recomecar incluso)
//   caixas e inimigos: ~5 sorteios por sala x 50 x 1.2%          ~ 3 moedas
//   bau dourado: ~8% das salas x 50 x 50%                        ~ 2 moedas
//   chefe: a cada 10 salas, ~2 vencidos por hora x 2 moedas      ~ 4 moedas
//   total ~ 9, arredondado para baixo porque o teto por sala corta parte
// Mudou uma chance de moeda vermelha: refazer esta conta e este numero.
export const RUBIES_PER_HOUR = 8;

export const OUTFIT_IDS = [
  'rogueHooded',
  'rogue',
  'skeletonMinion',
  'mage',
  'ranger',
  'skeletonRogue',
  'skeletonMage',
  'barbarian',
  'knight',
  'skeletonWarrior',
] as const;
export type OutfitId = (typeof OUTFIT_IDS)[number];

// a que o jogador ja tem ao instalar
export const DEFAULT_OUTFIT: OutfitId = 'rogueHooded';

// Horas de jogo que cada skin deve custar. As duas primeiras pagas saem
// rapido, de proposito: a primeira compra vem logo. As mais vistosas (o
// cavaleiro de armadura, o esqueleto guerreiro de elmo) ficam bem longe.
export const OUTFIT_HOURS: Record<OutfitId, number> = {
  rogueHooded: 0,
  rogue: 0.25,
  skeletonMinion: 0.25,
  mage: 1,
  ranger: 1.5,
  skeletonRogue: 2.5,
  skeletonMage: 4,
  barbarian: 6,
  knight: 10,
  skeletonWarrior: 16,
};

// preco em moedas vermelhas; 0 = de graca
export function outfitPrice(id: OutfitId): number {
  return Math.round(OUTFIT_HOURS[id] * RUBIES_PER_HOUR);
}
