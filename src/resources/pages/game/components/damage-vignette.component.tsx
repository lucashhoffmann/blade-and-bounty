type DamageVignetteProps = {
  // cada novo golpe ou aviso reinicia o pulso
  hits: number;
  color?: 'red' | 'blue' | 'yellow';
  // pulsa sem parar enquanto montado (vida baixa), em vez de uma vez so
  loop?: boolean;
  // nome para o teste achar, quando ha mais de uma borda do mesmo tipo
  name?: string;
};

// bordas que pulsam ao levar dano ou ficar parado; nao interceptam toque
export function DamageVignette({
  hits,
  color = 'red',
  loop = false,
  name,
}: DamageVignetteProps) {
  if (hits === 0) return null;
  return (
    <div
      key={hits}
      data-testid={
        name ??
        (color === 'yellow'
          ? 'boss-vignette'
          : loop
            ? 'low-health-vignette'
            : color === 'blue'
              ? 'idle-vignette'
              : 'damage-vignette')
      }
      className={`${loop ? 'animate-low-health' : 'animate-damage'} pointer-events-none absolute inset-0 opacity-0`}
      style={{
        background: `radial-gradient(ellipse at center, transparent 50%, color-mix(in srgb, ${{ red: COLORS.ui.destructive, blue: COLORS.ui.info, yellow: COLORS.ui.highlight }[color]} 65%, transparent) 100%)`,
      }}
    />
  );
}
import { COLORS } from '@/shared/colors';
