import type { CharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  KAYKIT_CLIPS_URL,
  KAYKIT_MEDIUM,
} from '@/app/engine/characters/kaykit.rig';
import type { EnemyKind } from '@/app/modules/world/types/world.types';
import type { OutfitId } from '@/app/store/game-store/game.store';

// O unico arquivo desta pasta que sabe que jogo e este: quem usa que modelo.
// Tipo fora da lista continua com o personagem de pecas
// (renderers/character.renderer.ts). Para desligar os modelos: esvaziar
// ENEMY_MODELS (o player sempre tem modelo: e o que a tela de personagem
// escolhe).

const kaykit = (file: string): CharacterModel => ({
  url: `/models/kaykit/${file}.glb`,
  clipsUrl: KAYKIT_CLIPS_URL,
  rig: KAYKIT_MEDIUM,
});
const SWORD = { slot: 'rightHand', url: '/models/kaykit/sword_1handed.gltf' };

// o player escolhe o personagem na tela de configuracao (`look.outfit`)
export const PLAYER_OUTFITS: Record<OutfitId, CharacterModel> = {
  rogueHooded: { ...kaykit('rogue-hooded'), holds: [SWORD] },
  rogue: { ...kaykit('rogue'), holds: [SWORD] },
  mage: { ...kaykit('mage'), holds: [SWORD] },
};

const BLADE = { slot: 'rightHand', url: '/models/kaykit/Skeleton_Blade.gltf' };
const AXE = { slot: 'rightHand', url: '/models/kaykit/Skeleton_Axe.gltf' };

// Cada tipo de inimigo tem uma ou mais caras: a escolha sai do `id` dele, e
// e so visual (a simulacao trata todos do tipo igual). Quem atira (archer,
// brute) recebe a arma de alcance do proprio jogo na mao (world.renderer),
// por isso nao tem `holds`.
export const ENEMY_MODELS: Partial<Record<EnemyKind, CharacterModel[]>> = {
  knight: [
    { ...kaykit('knight'), holds: [SWORD] },
    { ...kaykit('skeleton-minion'), holds: [BLADE] },
    { ...kaykit('skeleton-rogue'), holds: [BLADE] },
  ],
  archer: [kaykit('ranger'), kaykit('skeleton-mage')],
  brute: [
    {
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
  ],
  // chefe: esqueleto guerreiro gigante, de machado
  boss: [
    {
      ...kaykit('skeleton-warrior'),
      holds: [AXE],
      rig: { ...KAYKIT_MEDIUM, scale: KAYKIT_MEDIUM.scale * 1.9 },
    },
  ],
};
