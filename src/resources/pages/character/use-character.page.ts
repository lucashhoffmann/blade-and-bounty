import { useEffect, useRef, useState } from 'react';

import {
  type CharacterPreview,
  createCharacterPreview,
} from '@/app/engine/character-preview';
import { renderWeaponPreviews } from '@/app/engine/weapon-preview';
import type { WeaponId } from '@/app/modules/world/types/world.types';
import { useGameStore } from '@/app/store/game-store/game.store';

export function useCharacterPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<CharacterPreview | null>(null);
  const look = useGameStore((state) => state.look);
  const setLook = useGameStore((state) => state.setLook);
  const backToMenu = useGameStore((state) => state.backToMenu);
  // so do preview: qual arma o personagem segura; null = espada
  const [weapon, setWeapon] = useState<WeaponId | null>(null);
  // carteira: saldo de moedas vermelhas e skins que ele ja tem
  const rubies = useGameStore((state) => state.rubies);
  const owned = useGameStore((state) => state.owned);
  const buyOutfit = useGameStore((state) => state.buyOutfit);
  const blades = useGameStore((state) => state.blades);
  const buyBlade = useGameStore((state) => state.buyBlade);
  // arma no preview: a mesma ideia da skin
  const [shownBlade, setShownBlade] = useState(look.blade);
  const [wornBlade, setWornBlade] = useState(look.blade);
  if (wornBlade !== look.blade) {
    setWornBlade(look.blade);
    setShownBlade(look.blade);
  }
  // skin no preview: comeca na que ele veste; pode ser uma que ainda nao tem
  const [shown, setShown] = useState(look.outfit);
  // vestiu outra (comprou ou trocou): o preview acompanha
  const [worn, setWorn] = useState(look.outfit);
  if (worn !== look.outfit) {
    setWorn(look.outfit);
    setShown(look.outfit);
  }
  // fotos das armas para os cartoes, tiradas uma vez por montagem
  const [previews] = useState(renderWeaponPreviews);

  useEffect(() => {
    if (!canvasRef.current) return;
    const preview = createCharacterPreview(canvasRef.current);
    previewRef.current = preview;
    return () => {
      previewRef.current = null;
      preview.dispose();
    };
  }, []);

  // roda depois do efeito acima, entao ja desenha o look inicial
  useEffect(() => {
    previewRef.current?.setLook({ ...look, outfit: shown, blade: shownBlade });
  }, [look, shown, shownBlade]);

  useEffect(() => {
    previewRef.current?.setWeapon(weapon);
  }, [weapon]);

  return {
    canvasRef,
    look,
    setLook,
    shown,
    setShown,
    rubies,
    owned,
    buyOutfit,
    shownBlade,
    setShownBlade,
    blades,
    buyBlade,
    weapon,
    setWeapon,
    previews,
    backToMenu,
  };
}
