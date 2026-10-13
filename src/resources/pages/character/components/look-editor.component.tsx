import {
  DEFAULT_LOOK,
  OUTFIT_IDS,
  type PlayerLook,
  WEAPON_SCALE,
} from '@/app/store/game-store/game.store';
import { Button } from '@/resources/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTexts } from '@/shared/i18n';

type LookEditorProps = {
  look: PlayerLook;
  onChange: (patch: Partial<PlayerLook>) => void;
};

// Quem o player e (um dos modelos do jogo) e o tamanho da arma na mao. Cor e
// proporcao do corpo vem do modelo: nao ha o que ajustar.
export function LookEditor({ look, onChange }: LookEditorProps) {
  const t = useTexts();
  return (
    <section
      aria-label={t.character.title}
      className='flex w-full max-w-xs flex-col gap-3 rounded-md border-2 border-[var(--game-frame)] bg-[var(--game-hudPanel)] p-4 text-left text-sm'
    >
      <h2 className='font-black uppercase'>{t.character.outfit}</h2>
      <div className='flex flex-col gap-2'>
        {OUTFIT_IDS.map((id) => (
          <button
            key={id}
            type='button'
            aria-pressed={look.outfit === id}
            onClick={() => onChange({ outfit: id })}
            className={cn(
              'cursor-pointer rounded-md border-2 px-3 py-2 text-left font-bold transition-colors',
              look.outfit === id
                ? 'border-[var(--game-primary)] bg-[var(--game-primary)] text-[var(--game-primaryText)]'
                : 'border-[var(--game-border)] hover:border-[var(--game-frame)]',
            )}
          >
            {t.character.outfits[id]}
          </button>
        ))}
      </div>
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
      <Button
        variant='outline'
        size='sm'
        onClick={() => onChange(DEFAULT_LOOK)}
      >
        {t.character.reset}
      </Button>
    </section>
  );
}
