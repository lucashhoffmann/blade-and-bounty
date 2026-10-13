import {
  BLADE_IDS,
  type BladeId,
  bladePrice,
  DEFAULT_BLADE,
  DEFAULT_OUTFIT,
  OUTFIT_IDS,
  type OutfitId,
  outfitPrice,
} from '@/app/modules/skins/constants/skins.constants';

// Carteira de moedas vermelhas e skins compradas. E a fonte da verdade: o
// store so guarda uma copia para a tela mostrar.
//
// Travas contra edicao pelo inspetor do navegador:
// - o saldo mora numa variavel deste modulo, nao no estado do store. Mudar o
//   numero que a tela mostra (`setState`) nao muda o que a compra confere, e
//   o store desfaz a mudanca
// - o que vai para o armazenamento local leva um selo (`seal`) calculado do
//   conteudo. Saldo ou lista de skins editados a mao nao batem com o selo, e
//   a carteira volta ao zero
// - o saldo so cresce por `credit`, que o store chama com o que o cofre da
//   partida pagou (vault.system)
//
// Limite honesto: tudo roda no navegador, e o selo usa um segredo que esta no
// proprio codigo. Segura edicao de valor; nao segura quem reescrever o
// codigo. Trava de verdade so com servidor.

// `owned`: skins de corpo; `blades`: skins de arma
export type Wallet = { rubies: number; owned: OutfitId[]; blades: BladeId[] };
export type SavedWallet = Wallet & { seal: string };

const empty = (): Wallet => ({
  rubies: 0,
  owned: [DEFAULT_OUTFIT],
  blades: [DEFAULT_BLADE],
});
let wallet: Wallet = empty();

const SALT = 'b&b:wallet:7f3a91';
// FNV-1a de 32 bits: basta para notar edicao, nao e criptografia.
// `legacy`: carteira salva antes de existirem skins de arma (sem `blades`)
function seal({ rubies, owned, blades }: Wallet, legacy = false): string {
  const text =
    `${SALT}|${rubies}|${[...owned].sort().join(',')}` +
    (legacy ? '' : `|${[...blades].sort().join(',')}`);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

export function readWallet(): Wallet {
  return {
    rubies: wallet.rubies,
    owned: [...wallet.owned],
    blades: [...wallet.blades],
  };
}

// o que vai para o armazenamento local
export function saveWallet(): SavedWallet {
  return { ...readWallet(), seal: seal(wallet) };
}

// Carteira salva: so vale inteira e com o selo certo. Qualquer coisa fora
// disso (editada, corrompida, de outra versao) zera.
export function restoreWallet(saved: unknown): Wallet {
  const candidate = saved as Partial<SavedWallet> | null | undefined;
  // sem `blades`: salva antes das skins de arma; vale com o selo antigo
  const legacy = !!candidate && candidate.blades === undefined;
  const blades = legacy ? [DEFAULT_BLADE] : candidate?.blades;
  const valid =
    !!candidate &&
    Number.isInteger(candidate.rubies) &&
    (candidate.rubies as number) >= 0 &&
    Array.isArray(candidate.owned) &&
    candidate.owned.every((id) => OUTFIT_IDS.includes(id)) &&
    candidate.owned.includes(DEFAULT_OUTFIT) &&
    Array.isArray(blades) &&
    blades.every((id) => BLADE_IDS.includes(id)) &&
    blades.includes(DEFAULT_BLADE) &&
    candidate.seal ===
      seal(
        { rubies: candidate.rubies as number, owned: candidate.owned, blades },
        legacy,
      );
  wallet = valid
    ? {
        rubies: candidate.rubies as number,
        owned: [...new Set(candidate.owned)],
        blades: [...new Set(blades)],
      }
    : empty();
  return readWallet();
}

// moedas que o cofre da partida pagou
export function credit(rubies: number): Wallet {
  if (Number.isInteger(rubies) && rubies > 0) wallet.rubies += rubies;
  return readWallet();
}

export function owns(id: OutfitId): boolean {
  return wallet.owned.includes(id);
}

// Compra a skin, se ainda nao tem e o saldo cobre. Devolve se comprou.
export function buyOutfit(id: OutfitId): boolean {
  if (!OUTFIT_IDS.includes(id) || owns(id)) return false;
  const price = outfitPrice(id);
  if (wallet.rubies < price) return false;
  wallet.rubies -= price;
  wallet.owned.push(id);
  return true;
}

export function ownsBlade(id: BladeId): boolean {
  return wallet.blades.includes(id);
}

// Compra a skin de arma, se ainda nao tem e o saldo cobre.
export function buyBlade(id: BladeId): boolean {
  if (!BLADE_IDS.includes(id) || ownsBlade(id)) return false;
  const price = bladePrice(id);
  if (wallet.rubies < price) return false;
  wallet.rubies -= price;
  wallet.blades.push(id);
  return true;
}
