import type { CharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  KAYKIT_CLIPS_URL,
  KAYKIT_MEDIUM,
} from '@/app/engine/characters/kaykit.rig';
import type { EnemyKind } from '@/app/modules/world/types/world.types';

// O unico arquivo desta pasta que sabe que jogo e este: quem usa que modelo.
// Tipo fora da lista continua com o personagem de pecas
// (renderers/character.renderer.ts). Para desligar os modelos: esvaziar
// ENEMY_MODELS e por PLAYER_MODEL em null.

const kaykit = (file: string): CharacterModel => ({
  url: `/models/kaykit/${file}.glb`,
  clipsUrl: KAYKIT_CLIPS_URL,
  rig: KAYKIT_MEDIUM,
});
const SWORD = { slot: 'rightHand', url: '/models/kaykit/sword_1handed.gltf' };

export const PLAYER_MODEL: CharacterModel | null = {
  ...kaykit('rogue-hooded'),
  holds: [SWORD],
};

// Quem atira (suit, brute) recebe a arma de alcance do proprio jogo na mao
// (world.renderer), por isso nao tem `holds`.
export const ENEMY_MODELS: Partial<Record<EnemyKind, CharacterModel>> = {
  knight: { ...kaykit('knight'), holds: [SWORD] },
  archer: kaykit('ranger'),
  brute: {
    ...kaykit('barbarian'),
    rig: {
      ...KAYKIT_MEDIUM,
      // maior que os outros, e atira com as duas maos
      scale: KAYKIT_MEDIUM.scale * 1.25,
      clips: {
        ...KAYKIT_MEDIUM.clips,
        shot: { name: 'Ranged_2H_Shoot', to: 0.6 },
      },
    },
  },
};
