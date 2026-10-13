import {
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

export type Wallet = { rubies: number; owned: OutfitId[] };
export type SavedWallet = Wallet & { seal: string };

const EMPTY: Wallet = { rubies: 0, owned: [DEFAULT_OUTFIT] };
let wallet: Wallet = { ...EMPTY };

const SALT = 'b&b:wallet:7f3a91';
// FNV-1a de 32 bits: basta para notar edicao, nao e criptografia
function seal({ rubies, owned }: Wallet): string {
  const text = `${SALT}|${rubies}|${[...owned].sort().join(',')}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

export function readWallet(): Wallet {
  return { rubies: wallet.rubies, owned: [...wallet.owned] };
}

// o que vai para o armazenamento local
export function saveWallet(): SavedWallet {
  return { ...readWallet(), seal: seal(wallet) };
}

// Carteira salva: so vale inteira e com o selo certo. Qualquer coisa fora
// disso (editada, corrompida, de outra versao) zera.
export function restoreWallet(saved: unknown): Wallet {
  const candidate = saved as Partial<SavedWallet> | null | undefined;
  const valid =
    !!candidate &&
    Number.isInteger(candidate.rubies) &&
    (candidate.rubies as number) >= 0 &&
    Array.isArray(candidate.owned) &&
    candidate.owned.every((id) => OUTFIT_IDS.includes(id)) &&
    candidate.owned.includes(DEFAULT_OUTFIT) &&
    candidate.seal ===
      seal({ rubies: candidate.rubies as number, owned: candidate.owned });
  wallet = valid
    ? {
        rubies: candidate.rubies as number,
        owned: [...new Set(candidate.owned)],
      }
    : { ...EMPTY, owned: [...EMPTY.owned] };
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
