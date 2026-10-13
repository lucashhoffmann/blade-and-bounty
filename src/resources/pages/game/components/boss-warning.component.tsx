type BossWarningProps = {
  // fracao da vida do chefe da sala (0 a 1); 0 = sem chefe por perto
  boss: number;
  warning: string;
};

// Chefe na sala: o aviso despenca na tela ao entrar e some sozinho. A barra
// de vida dele fica no HUD (hud.component).
export function BossWarning({ boss, warning }: BossWarningProps) {
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
    </>
  );
}
