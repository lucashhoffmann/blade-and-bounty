import type { CharacterModel } from '@/app/engine/characters/character-model.loader';
import {
  KAYKIT_CLIPS_URL,
  KAYKIT_MEDIUM,
} from '@/app/engine/characters/kaykit.rig';
import type { EnemyKind } from '@/app/modules/world/types/world.types';
import type {
  BladeId,
  OutfitId,
} from '@/app/modules/skins/constants/skins.constants';

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

const BLADE = { slot: 'rightHand', url: '/models/kaykit/Skeleton_Blade.gltf' };
const AXE = { slot: 'rightHand', url: '/models/kaykit/Skeleton_Axe.gltf' };

// Skins do player: compradas na loja da tela inicial (`look.outfit`,
// skins.constants). Todos os personagens do kit, do ladino ao esqueleto
// guerreiro; a simulacao e a mesma para todos. O que vai na mao e outra
// skin, a de arma: ver `playerModel`.
export const PLAYER_OUTFITS: Record<OutfitId, CharacterModel> = {
  rogueHooded: kaykit('rogue-hooded'),
  rogue: kaykit('rogue'),
  mage: kaykit('mage'),
  ranger: kaykit('ranger'),
  barbarian: kaykit('barbarian'),
  knight: kaykit('knight'),
  skeletonMinion: kaykit('skeleton-minion'),
  skeletonRogue: kaykit('skeleton-rogue'),
  skeletonMage: kaykit('skeleton-mage'),
  skeletonWarrior: kaykit('skeleton-warrior'),
};

// Skins de arma (`look.blade`): o arquivo do que o player leva na mao no
// lugar da espada. So desenho.
export const BLADE_URLS: Record<BladeId, string> = {
  sword: SWORD.url,
  dagger: '/models/kaykit/dagger.gltf',
  axe: '/models/kaykit/axe_1handed.gltf',
  wand: '/models/kaykit/wand.gltf',
  skeletonBlade: BLADE.url,
  staff: '/models/kaykit/staff.gltf',
  skeletonAxe: AXE.url,
  greatsword: '/models/kaykit/sword_2handed_color.gltf',
  greataxe: '/models/kaykit/axe_2handed.gltf',
  skeletonStaff: '/models/kaykit/Skeleton_Staff.gltf',
};

// o modelo do player como ele esta vestido: o corpo da skin com a arma
// escolhida na mao
export function playerModel(look: {
  outfit: OutfitId;
  blade: BladeId;
}): CharacterModel {
  return {
    ...(PLAYER_OUTFITS[look.outfit] ?? PLAYER_OUTFITS.rogueHooded),
    holds: [
      { slot: 'rightHand', url: BLADE_URLS[look.blade] ?? BLADE_URLS.sword },
    ],
  };
}

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
