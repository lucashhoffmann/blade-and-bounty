/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import {
  BLADE_URLS,
  PLAYER_OUTFITS,
  playerModel,
} from '@/app/engine/characters/character-models.config';
import {
  BLADE_IDS,
  OUTFIT_IDS,
} from '@/app/modules/skins/constants/skins.constants';

// Skins do player (so deste jogo): tudo que a loja vende tem que ter arquivo.
describe('arquivos das skins do player', () => {
  it('toda skin de corpo vendida tem o modelo publicado', () => {
    for (const id of OUTFIT_IDS) {
      expect(existsSync(`public${PLAYER_OUTFITS[id].url}`)).toBe(true);
    }
  });

  it('toda skin de arma tem o .gltf e os arquivos que ele cita', () => {
    for (const id of BLADE_IDS) {
      const path = `public${BLADE_URLS[id]}`;
      expect(existsSync(path)).toBe(true);
      const { buffers, images } = JSON.parse(readFileSync(path, 'utf8')) as {
        buffers: { uri: string }[];
        images: { uri: string }[];
      };
      for (const { uri } of [...buffers, ...images]) {
        expect(existsSync(`public/models/kaykit/${uri}`)).toBe(true);
      }
    }
  });

  it('o modelo do player e o corpo da skin com a arma escolhida na mao', () => {
    const model = playerModel({ outfit: 'knight', blade: 'staff' });
    expect(model.url).toBe(PLAYER_OUTFITS.knight.url);
    expect(model.holds).toEqual([{ slot: 'rightHand', url: BLADE_URLS.staff }]);
  });
});
