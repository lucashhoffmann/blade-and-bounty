import {
  BLADE_IDS,
  type BladeId,
  bladePrice,
  OUTFIT_IDS,
  type OutfitId,
  outfitPrice,
} from '@/app/modules/skins/constants/skins.constants';
import {
  type PlayerLook,
  WEAPON_SCALE,
} from '@/app/store/game-store/game.store';
import { cn } from '@/shared/lib/utils';
import { useTexts } from '@/shared/i18n';

type LookEditorProps = {
  look: PlayerLook;
  // o que o preview esta mostrando (pode ser algo que ele ainda nao tem)
  shown: OutfitId;
  shownBlade: BladeId;
  owned: OutfitId[];
  blades: BladeId[];
  rubies: number;
  onShow: (id: OutfitId) => void;
  onShowBlade: (id: BladeId) => void;
  onBuy: (id: OutfitId) => void;
  onBuyBlade: (id: BladeId) => void;
  onChange: (patch: Partial<PlayerLook>) => void;
};

const COIN =
  'inline-block size-3.5 shrink-0 rounded-full border-2 border-[var(--game-ink)] bg-red-600';

type ShelfProps<T extends string> = {
  ids: readonly T[];
  name: (id: T) => string;
  price: (id: T) => number;
  owned: T[];
  wearing: T;
  shown: T;
  rubies: number;
  onShow: (id: T) => void;
  onBuy: (id: T) => void;
  onUse: (id: T) => void;
};

// Prateleira da loja: uma linha por item, com preco fixo em moedas
// vermelhas. Tocar na linha mostra o item no preview; o botao compra, veste,
// ou diz quanto falta.
function Shelf<T extends string>({
  ids,
  name,
  price,
  owned,
  wearing,
  shown,
  rubies,
  onShow,
  onBuy,
  onUse,
}: ShelfProps<T>) {
  const t = useTexts();
  return (
    <ul className='flex flex-col gap-2'>
      {ids.map((id) => {
        const cost = price(id);
        const short = cost - rubies;
        return (
          <li
            key={id}
            data-shown={shown === id}
            className={cn(
              'flex items-center gap-2 rounded-md border-2 p-2 transition-colors',
              shown === id
                ? 'border-[var(--game-primary)] bg-black/25'
                : 'border-[var(--game-border)]',
            )}
          >
            <button
              type='button'
              aria-pressed={shown === id}
              onClick={() => onShow(id)}
              className='flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left'
            >
              <span className='truncate font-bold'>{name(id)}</span>
              <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                {cost === 0 ? (
                  t.character.free
                ) : (
                  <>
                    <span
                      aria-hidden
                      className={COIN}
                    />
                    <span aria-label={t.character.price(cost)}>{cost}</span>
                  </>
                )}
              </span>
            </button>
            {wearing === id ? (
              <span className='rounded-md bg-[var(--game-success)] px-2 py-1 text-xs font-black uppercase'>
                {t.character.inUse}
              </span>
            ) : owned.includes(id) ? (
              <button
                type='button'
                aria-label={`${t.character.use} ${name(id)}`}
                onClick={() => onUse(id)}
                className='cursor-pointer rounded-md border-2 border-[var(--game-frame)] px-3 py-1 text-xs font-black uppercase hover:bg-white/10'
              >
                {t.character.use}
              </button>
            ) : short > 0 ? (
              <span className='text-muted-foreground rounded-md border-2 border-dashed border-[var(--game-border)] px-2 py-1 text-xs font-bold'>
                {t.character.missing(short)}
              </span>
            ) : (
              <button
                type='button'
                aria-label={`${t.character.buy} ${name(id)}`}
                onClick={() => onBuy(id)}
                className='cursor-pointer rounded-md bg-[var(--game-primary)] px-3 py-1 text-xs font-black text-[var(--game-primaryText)] uppercase hover:brightness-110'
              >
                {t.character.buy}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Loja: skins de corpo (todos os personagens do kit) e skins de arma (o que
// vai na mao no lugar da espada). Embaixo, o tamanho da arma.
export function LookEditor({
  look,
  shown,
  shownBlade,
  owned,
  blades,
  rubies,
  onShow,
  onShowBlade,
  onBuy,
  onBuyBlade,
  onChange,
}: LookEditorProps) {
  const t = useTexts();
  return (
    <section
      aria-label={t.character.outfit}
      className='flex w-full max-w-sm flex-col gap-3 rounded-md border-2 border-[var(--game-frame)] bg-[var(--game-hudPanel)] p-4 text-left text-sm'
    >
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-black uppercase'>{t.character.outfit}</h2>
        <p
          aria-label={t.character.balance(rubies)}
          className='flex items-center gap-1.5 font-black tabular-nums'
        >
          <span
            aria-hidden
            className={COIN}
          />
          {rubies}
        </p>
      </div>
      <Shelf
        ids={OUTFIT_IDS}
        name={(id) => t.character.outfits[id]}
        price={outfitPrice}
        owned={owned}
        wearing={look.outfit}
        shown={shown}
        rubies={rubies}
        onShow={onShow}
        onBuy={onBuy}
        onUse={(id) => onChange({ outfit: id })}
      />
      <p className='text-muted-foreground text-xs'>{t.character.shopNote}</p>
      <h2 className='mt-2 font-black uppercase'>{t.character.bladesTitle}</h2>
      <Shelf
        ids={BLADE_IDS}
        name={(id) => t.character.blades[id]}
        price={bladePrice}
        owned={blades}
        wearing={look.blade}
        shown={shownBlade}
        rubies={rubies}
        onShow={onShowBlade}
        onBuy={onBuyBlade}
        onUse={(id) => onChange({ blade: id })}
      />
      <p className='text-muted-foreground text-xs'>{t.character.bladesNote}</p>
      {/* numero fora do <label>: o nome acessivel do slider segue so o rotulo */}
      <div className='flex items-center gap-2'>
        <label className='flex flex-1 items-center justify-between gap-3'>
          {t.character.weapon}
          <input
            type='range'
            min={WEAPON_SCALE.min}
            max={WEAPON_SCALE.max}
            step={0.05}
            value={look.weapon}
            onChange={(event) =>
              onChange({ weapon: Number(event.target.value) })
            }
            className='w-32 accent-[var(--game-primary)]'
          />
        </label>
        <output className='w-10 text-right font-bold tabular-nums'>
          {Math.round(look.weapon * 100)}%
        </output>
      </div>
    </section>
  );
}
