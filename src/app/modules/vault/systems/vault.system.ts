import {
  RUBY_BOSS_CAP,
  RUBY_ROOM_CAP,
} from '@/app/modules/world/constants/world.constants';
import type { World } from '@/app/modules/world/types/world.types';

// Cofre das moedas vermelhas. Elas valem fora da partida (compram skin),
// entao o que entra no saldo nao pode depender de nada que se edita pelo
// inspetor do navegador: nem `world.pickups`, nem `run.rubies`.
//
// Como trava:
// - o livro de cada partida mora aqui, numa variavel do modulo, fora do
//   `World`. Do console nao ha referencia para ele
// - cada sala paga no maximo um teto fixo (RUBY_ROOM_CAP; RUBY_BOSS_CAP na
//   arena). Moeda a mais na mesma sala, venha de onde vier, nao paga
// - so paga sala que existe agora em `world.rooms` e partida solo
// - o saldo so cresce por `takeRubies`, chamado pelo store a cada passo
//
// Limite honesto: e um jogo que roda inteiro no navegador. Isto segura edicao
// de valor pelo inspetor e pelo armazenamento local; quem reescrever o
// codigo carregado passa. Trava de verdade so com servidor.

type Ledger = {
  // sala -> moedas ja pagas nela
  rooms: Map<number, number>;
  // pagas e ainda nao levadas para o saldo
  pending: number;
};

// uma por partida: a chave e o `run`, que nasce com o mundo e nao e trocado
const ledgers = new WeakMap<object, Ledger>();

function ledgerOf(world: World): Ledger {
  let ledger = ledgers.get(world.run);
  if (!ledger) {
    ledger = { rooms: new Map(), pending: 0 };
    ledgers.set(world.run, ledger);
  }
  return ledger;
}

// O player pegou uma moeda vermelha na sala `roomIndex`: paga, se a sala
// ainda tem o que pagar. Devolve se pagou.
export function claimRuby(world: World, roomIndex: number): boolean {
  if (world.mode !== 'solo') return false;
  const room = world.rooms.find((candidate) => candidate.index === roomIndex);
  if (!room) return false;
  const ledger = ledgerOf(world);
  const paid = ledger.rooms.get(roomIndex) ?? 0;
  if (paid >= (room.kind === 'boss' ? RUBY_BOSS_CAP : RUBY_ROOM_CAP)) {
    return false;
  }
  ledger.rooms.set(roomIndex, paid + 1);
  ledger.pending++;
  return true;
}

// Leva para o saldo o que o cofre pagou desde a ultima chamada, e zera.
export function takeRubies(world: World): number {
  const ledger = ledgers.get(world.run);
  if (!ledger) return 0;
  const { pending } = ledger;
  ledger.pending = 0;
  return pending;
}
