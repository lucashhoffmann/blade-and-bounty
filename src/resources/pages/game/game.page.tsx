import {
  getWorld,
  pressJoystickAttack,
  setJoystickCrouch,
  setJoystickDash,
  setJoystickInput,
} from '@/app/store/game-store/game.store';
import { VirtualJoystick } from '@/resources/components/base/virtual-joystick/virtual-joystick.component';
import { BossWarning } from '@/resources/pages/game/components/boss-warning.component';
import { DamageVignette } from '@/resources/pages/game/components/damage-vignette.component';
import { GameOverDialog } from '@/resources/pages/game/components/game-over-dialog.component';
import { Hud } from '@/resources/pages/game/components/hud.component';
import { MatchMenu } from '@/resources/pages/game/components/match-menu.component';
import { ReviveDialog } from '@/resources/pages/game/components/revive-dialog.component';
import { Scoreboard } from '@/resources/pages/game/components/scoreboard.component';
import { KillStreak } from '@/resources/pages/game/components/kill-streak.component';
import { LegendDialog } from '@/resources/pages/game/components/legend-dialog.component';
import { ShopDialog } from '@/resources/pages/game/components/shop-dialog.component';
import { TutorialOverlay } from '@/resources/pages/game/components/tutorial-overlay/tutorial-overlay.component';
import { useGamePage } from '@/resources/pages/game/use-game.page';

// abaixo disso (pontos de vida) a tela pulsa em vermelho
const LOW_HP = 20;

export function GamePage() {
  const {
    canvasRef,
    loading,
    loadingLabel,
    bossWarning,
    screen,
    hud,
    arsenal,
    selectWeapon,
    hits,
    idleWarnings,
    market,
    best,
    legend,
    previews,
    buy,
    closeShop,
    restart,
    pause,
    online,
    host,
    menu,
    endMatch,
    leaveMatch,
    reviving,
    revive,
    reviveAllowance,
    waitingNote,
    scores,
    streak,
    scoreboard,
    toggleScoreboard,
    backToMenu,
    tutorial,
  } = useGamePage();

  return (
    <div className='relative h-full w-full'>
      <canvas
        ref={canvasRef}
        className='block h-full w-full'
      />
      <DamageVignette hits={hits} />
      {/* vida baixa: a mesma borda vermelha, pulsando ate recuperar ou morrer */}
      <DamageVignette
        hits={hud.hp > 0 && hud.hp < LOW_HP ? 1 : 0}
        loop
      />
      <DamageVignette
        hits={idleWarnings}
        color='blue'
      />
      {/* perseguicao: a mesma borda vermelha da vida baixa, enquanto houver
          inimigo em alerta */}
      <DamageVignette
        hits={hud.chased ? 1 : 0}
        loop
        name='chase-vignette'
      />
      {/* chefe na sala: borda amarela pulsando ate ele cair, aviso e a barra
          de vida dele */}
      <DamageVignette
        hits={hud.boss > 0 ? 1 : 0}
        color='yellow'
        loop
      />
      <BossWarning
        boss={hud.boss}
        warning={bossWarning}
      />
      <Hud
        hud={hud}
        arsenal={arsenal}
        previews={previews}
        onSelectWeapon={selectWeapon}
        onPause={screen === 'playing' ? pause : undefined}
        onScoreboard={
          online && screen === 'playing' ? toggleScoreboard : undefined
        }
      />
      <KillStreak
        count={screen === 'playing' ? streak.count : 0}
        at={streak.at}
      />
      <Scoreboard
        open={scoreboard && screen === 'playing'}
        scores={scores}
      />
      <ReviveDialog
        open={reviving && screen === 'playing'}
        scores={scores}
        allowance={reviveAllowance}
        onRevive={revive}
        onClose={closeShop}
      />
      <MatchMenu
        open={menu}
        host={host}
        onResume={pause}
        onEnd={endMatch}
        onLeave={leaveMatch}
      />
      {screen === 'playing' && (
        <VirtualJoystick
          onMove={setJoystickInput}
          onDash={setJoystickDash}
          onCrouch={setJoystickCrouch}
          onAttack={pressJoystickAttack}
        />
      )}
      {/* no tutorial a abertura e o proprio guia; a pausa segue na legenda */}
      <LegendDialog
        open={(screen === 'intro' && !tutorial) || screen === 'paused'}
        {...legend}
      />
      <TutorialOverlay />
      <ShopDialog
        open={screen === 'shop'}
        money={hud.money}
        market={market}
        arsenal={arsenal}
        dashes={hud.dashes}
        previews={previews}
        onBuy={buy}
        onClose={closeShop}
      />
      <GameOverDialog
        open={screen === 'gameover'}
        room={hud.room}
        kills={hud.kills}
        best={best}
        run={getWorld()?.run ?? null}
        onRestart={restart}
        note={waitingNote}
        onMenu={online ? leaveMatch : backToMenu}
      />
      {loading && (
        <div
          role='status'
          className='font-display absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--game-homeDeep)] text-[var(--game-foreground)]'
        >
          <div className='size-10 animate-spin rounded-full border-4 border-[var(--game-frame)] border-t-transparent' />
          <p className='text-lg tracking-wide uppercase'>{loadingLabel}</p>
        </div>
      )}
    </div>
  );
}
