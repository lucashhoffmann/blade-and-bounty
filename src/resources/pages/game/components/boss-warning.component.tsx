import { Skull } from 'lucide-react';

type BossWarningProps = {
  // fracao da vida do chefe da sala (0 a 1); 0 = sem chefe por perto
  boss: number;
  label: string;
  warning: string;
};

// Chefe na sala: o aviso despenca na tela ao entrar e some sozinho; a barra
// de vida dele fica embaixo enquanto ele estiver de pe.
export function BossWarning({ boss, label, warning }: BossWarningProps) {
  if (boss <= 0) return null;
  return (
    <>
      {/* montado so quando o chefe aparece: a animacao toca uma vez */}
      <p
        role='alert'
        className='font-display text-outline animate-streak pointer-events-none absolute inset-x-0 top-[28%] text-center text-4xl tracking-wide text-[var(--game-highlight)] uppercase sm:text-6xl'
      >
        {warning}
      </p>
      <div className='font-display animate-hud-in pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-1 px-4 sm:bottom-6'>
        <p className='text-outline flex items-center gap-1.5 text-sm tracking-widest text-[var(--game-highlight)] uppercase sm:text-base'>
          <Skull
            aria-hidden
            className='size-4 sm:size-5'
            strokeWidth={2.5}
          />
          {label}
        </p>
        <div
          role='progressbar'
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(boss * 100)}
          className='h-3 w-[min(70vw,28rem)] overflow-hidden rounded-sm border-2 border-[var(--game-frame)] bg-black/60 shadow-[0_3px_0_var(--game-ink)] sm:h-4'
        >
          <div
            className='h-full bg-gradient-to-b from-amber-400 to-orange-700 transition-[width] duration-300'
            style={{ width: `${boss * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
