import {
  BLADE_HOURS,
  BLADE_IDS,
  bladePrice,
  DEFAULT_BLADE,
  DEFAULT_OUTFIT,
  OUTFIT_HOURS,
  OUTFIT_IDS,
  outfitPrice,
  RUBIES_PER_HOUR,
} from '@/app/modules/skins/constants/skins.constants';

describe('preco das skins', () => {
  const prices = OUTFIT_IDS.map(outfitPrice);

  it('a skin padrao e de graca; as outras custam', () => {
    expect(outfitPrice(DEFAULT_OUTFIT)).toBe(0);
    expect(prices.filter((price) => price === 0)).toHaveLength(1);
  });

  it('o preco e as horas de jogo da skin vezes o que uma hora rende', () => {
    for (const id of OUTFIT_IDS) {
      expect(outfitPrice(id)).toBe(
        Math.round(OUTFIT_HOURS[id] * RUBIES_PER_HOUR),
      );
    }
    // fixo: perguntar de novo da o mesmo
    expect(OUTFIT_IDS.map(outfitPrice)).toEqual(prices);
  });

  it('duas skins saem rapido: menos de meia hora de jogo cada', () => {
    const quick = OUTFIT_IDS.filter(
      (id) => OUTFIT_HOURS[id] > 0 && OUTFIT_HOURS[id] <= 0.5,
    );
    expect(quick).toHaveLength(2);
  });

  it('a loja vai da mais barata a mais cara, e as do fim custam muitas horas', () => {
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(OUTFIT_HOURS[OUTFIT_IDS.at(-1)!]).toBeGreaterThanOrEqual(10);
  });
});

describe('skins de arma', () => {
  it('a espada e de graca e as outras tem preco fixo, da mais barata a mais cara', () => {
    const prices = BLADE_IDS.map(bladePrice);
    expect(bladePrice(DEFAULT_BLADE)).toBe(0);
    expect(prices.filter((price) => price === 0)).toHaveLength(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    for (const id of BLADE_IDS) {
      expect(bladePrice(id)).toBe(
        Math.round(BLADE_HOURS[id] * RUBIES_PER_HOUR),
      );
    }
  });
});
