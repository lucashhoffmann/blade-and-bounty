import { preloadCharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  ENEMY_MODELS,
  PLAYER_OUTFITS,
} from '@/app/engine/characters/character-models.config';
import { preloadModelKit } from '@/app/engine/scenery/model-kit';
import { SCENERY } from '@/app/engine/scenery/scenery.config';
import type { OutfitId } from '@/app/store/game-store/game.store';

// espera maxima pela rede antes de deixar a partida comecar mesmo assim
export const PRELOAD_TIMEOUT = 12000;

// Baixa o que a partida desenha: cenario, o personagem escolhido e os
// inimigos. Resolve quando tudo chegou, ou falhou, ou o tempo acabou: nunca
// rejeita, porque sem os arquivos o jogo ainda roda com o desenho antigo.
// Chamar de novo e barato: os carregadores guardam o que ja baixaram.
export function preloadGameAssets(outfit: OutfitId): Promise<void> {
  const loads = [
    ...(SCENERY.url ? [preloadModelKit(SCENERY.url)] : []),
    preloadCharacterModel(PLAYER_OUTFITS[outfit]),
    ...Object.values(ENEMY_MODELS).flat().map(preloadCharacterModel),
  ];
  return Promise.race([
    Promise.allSettled(loads).then(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT)),
  ]);
}
