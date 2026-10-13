import { preloadCharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  ENEMY_MODELS,
  playerModel,
} from '@/app/engine/characters/character-models.config';
import { preloadModelKit } from '@/app/engine/scenery/model-kit';
import { SCENERY } from '@/app/engine/scenery/scenery.config';
import type {
  BladeId,
  OutfitId,
} from '@/app/modules/skins/constants/skins.constants';

// espera maxima pela rede antes de deixar a partida comecar mesmo assim
export const PRELOAD_TIMEOUT = 12000;

// Baixa o que a partida desenha: cenario, o player como esta vestido (skin e
// arma) e os inimigos. Resolve quando tudo chegou, ou falhou, ou o tempo acabou: nunca
// rejeita, porque sem os arquivos o jogo ainda roda com o desenho antigo.
// Chamar de novo e barato: os carregadores guardam o que ja baixaram.
export function preloadGameAssets(look: {
  outfit: OutfitId;
  blade: BladeId;
}): Promise<void> {
  const loads = [
    ...(SCENERY.url ? [preloadModelKit(SCENERY.url)] : []),
    preloadCharacterModel(playerModel(look)),
    ...Object.values(ENEMY_MODELS).flat().map(preloadCharacterModel),
  ];
  return Promise.race([
    Promise.allSettled(loads).then(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT)),
  ]);
}
