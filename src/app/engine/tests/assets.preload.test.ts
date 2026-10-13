import { vi } from 'vitest';

import {
  PRELOAD_TIMEOUT,
  preloadGameAssets,
} from '@/app/engine/assets.preload';
import { preloadCharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  BLADE_URLS,
  ENEMY_MODELS,
  PLAYER_OUTFITS,
} from '@/app/engine/characters/character-models.config';
import { preloadModelKit } from '@/app/engine/scenery/model-kit';
import { SCENERY } from '@/app/engine/scenery/scenery.config';

vi.mock('@/app/engine/characters/character-model.loader', () => ({
  preloadCharacterModel: vi.fn(),
}));
vi.mock('@/app/engine/scenery/model-kit', () => ({
  preloadModelKit: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(preloadCharacterModel).mockReset().mockResolvedValue();
  vi.mocked(preloadModelKit).mockReset().mockResolvedValue();
});

describe('preloadGameAssets', () => {
  it('baixa o cenario, o personagem escolhido e todos os inimigos', async () => {
    await preloadGameAssets({ outfit: 'mage', blade: 'staff' });
    expect(preloadModelKit).toHaveBeenCalledWith(SCENERY.url);
    const asked = vi
      .mocked(preloadCharacterModel)
      .mock.calls.map(([model]) => model);
    // o player como esta vestido: o corpo da skin e a arma escolhida
    expect(asked.map((model) => model.url)).toContain(PLAYER_OUTFITS.mage.url);
    expect(asked.map((model) => model.url)).not.toContain(
      PLAYER_OUTFITS.rogue.url,
    );
    expect(asked.flatMap((model) => model.holds ?? [])).toContainEqual({
      slot: 'rightHand',
      url: BLADE_URLS.staff,
    });
    for (const model of Object.values(ENEMY_MODELS).flat()) {
      expect(asked).toContain(model);
    }
  });

  it('arquivo que falha nao segura a partida: resolve mesmo assim', async () => {
    vi.mocked(preloadCharacterModel).mockRejectedValue(new Error('rede'));
    vi.mocked(preloadModelKit).mockRejectedValue(new Error('rede'));
    await expect(
      preloadGameAssets({ outfit: 'rogueHooded', blade: 'sword' }),
    ).resolves.toBeUndefined();
  });

  it('rede que nao responde nao trava: libera depois de PRELOAD_TIMEOUT', async () => {
    vi.useFakeTimers();
    vi.mocked(preloadModelKit).mockReturnValue(new Promise(() => {}));
    let done = false;
    void preloadGameAssets({ outfit: 'rogueHooded', blade: 'sword' }).then(
      () => (done = true),
    );
    await vi.advanceTimersByTimeAsync(PRELOAD_TIMEOUT - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
    vi.useRealTimers();
  });
});
