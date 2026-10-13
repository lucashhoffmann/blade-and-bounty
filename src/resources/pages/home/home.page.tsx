import { Play, Settings, Trophy, UserRound, Users } from 'lucide-react';

import { useGameStore } from '@/app/store/game-store/game.store';
import { useHomePage } from '@/resources/pages/home/use-home.page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/resources/components/ui/dialog';
import { InstallApp } from '@/resources/pages/home/components/install-app/install-app.component';
import { useLanguage, useTexts } from '@/shared/i18n';

// botao brute de jogo: borda branca, sombra dura embaixo, afunda ao clicar
const CHUNKY =
  'text-outline flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-4 border-[var(--game-frame)] text-white uppercase shadow-[0_5px_0_var(--game-ink)] transition-transform hover:scale-105 active:translate-y-1 active:shadow-none';
const SECONDARY = `${CHUNKY} w-full bg-[var(--game-secondary)] px-5 py-2 text-lg`;

export function HomePage() {
  const t = useTexts();
  const language = useLanguage((state) => state.language);
  const setLanguage = useLanguage((state) => state.setLanguage);
  const best = useGameStore((state) => state.best);
  const startRun = useGameStore((state) => state.startRun);
  const openCharacter = useGameStore((state) => state.openCharacter);
  const openLobby = useGameStore((state) => state.openLobby);
  const { online } = useHomePage();
  const bloodColor = useGameStore((state) => state.bloodColor);
  const setBloodColor = useGameStore((state) => state.setBloodColor);

  // Rola quando o conteudo nao cabe (celular deitado, muitos botoes). O centro
  // vem das margens automaticas do titulo e do rodape: sobrando espaco,
  // centralizam; faltando, encostam no topo sem cortar nada. touch-pan-y: o
  // body bloqueia gestos de toque por causa do jogo.
  return (
    <main className='game-menu-background font-display relative flex h-full touch-pan-y flex-col items-center gap-7 overflow-x-hidden overflow-y-auto p-6 pt-28 text-center'>
      {/* Lampiao pendurado iluminando o titulo: corrente, corpo de ferro com
          a chama dentro, luz amarela que abre para baixo e a poca onde ela
          bate. Balanca na corrente e a chama tremula (spotlight-light, em
          index.css). */}
      <div
        aria-hidden
        className='spotlight pointer-events-none absolute top-0 left-1/2 h-[68vh] w-[min(150vw,60rem)] origin-top'
      >
        <div className='spotlight-light absolute inset-x-0 top-14 bottom-0 bg-gradient-to-b from-amber-300/45 via-amber-400/12 to-transparent blur-md [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)]' />
        {/* miolo mais forte da luz */}
        <div className='spotlight-light absolute inset-x-0 top-14 bottom-0 bg-gradient-to-b from-yellow-200/35 via-amber-300/8 to-transparent blur-sm [clip-path:polygon(48%_0,52%_0,70%_100%,30%_100%)]' />
        <div
          data-testid='lantern'
          className='absolute top-0 left-1/2 flex -translate-x-1/2 flex-col items-center'
        >
          {/* corrente e argola */}
          <div className='h-7 w-1 bg-[var(--game-ink)]' />
          <div className='-mb-1 size-3 rounded-full border-[3px] border-[var(--game-ink)]' />
          {/* tampa, vidro com a chama e base */}
          <div className='h-2 w-9 rounded-t-lg bg-[var(--game-ink)]' />
          <div className='spotlight-light relative flex h-11 w-7 items-end justify-center border-x-[3px] border-[var(--game-ink)] bg-amber-200/90 shadow-[0_0_34px_14px_rgb(255_184_64/0.7)]'>
            <div className='mb-1 h-6 w-3 rounded-[50%_50%_50%_50%/65%_65%_35%_35%] bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100' />
          </div>
          <div className='h-2 w-9 rounded-b-md bg-[var(--game-ink)]' />
        </div>
      </div>
      <div
        aria-hidden
        className='spotlight-light pointer-events-none absolute top-[22%] left-1/2 h-[46vh] w-[min(130vw,48rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(255_196_87/0.24)_0%,rgb(255_170_60/0.07)_45%,transparent_70%)]'
      />
      <h1 className='text-outline relative mt-auto flex -rotate-3 flex-col font-[family-name:var(--font-title)] text-6xl leading-none tracking-wide uppercase sm:text-7xl'>
        <span className='text-white'>Blade</span>{' '}
        <span className='text-[1.15em] text-[var(--game-brand)]'>
          &amp; Bounty
        </span>
      </h1>
      <p className='text-outline relative flex items-center gap-2 rounded-full bg-black/35 px-4 py-1 text-lg text-[var(--game-highlight)]'>
        <Trophy
          aria-hidden
          className='size-5'
          strokeWidth={3}
        />
        {t.home.record(best)}
      </p>
      <button
        type='button'
        className={`${CHUNKY} relative bg-[var(--game-success)] px-14 py-4 text-4xl`}
        onClick={() => startRun()}
      >
        <Play
          aria-hidden
          className='size-8 fill-white'
          strokeWidth={3}
        />
        {t.home.play}
      </button>
      <div className='relative flex w-full max-w-xs flex-col gap-3'>
        <button
          type='button'
          className={SECONDARY}
          onClick={openCharacter}
        >
          <UserRound
            aria-hidden
            className='size-5'
            strokeWidth={3}
          />
          {t.home.character}
        </button>
        {/* so com o servidor de salas no ar (use-home.page) */}
        {online && (
          <button
            type='button'
            className={SECONDARY}
            onClick={openLobby}
          >
            <Users
              aria-hidden
              className='size-5'
              strokeWidth={3}
            />
            {t.home.multiplayer}
          </button>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type='button'
              className={SECONDARY}
            >
              <Settings
                aria-hidden
                className='size-5'
                strokeWidth={3}
              />
              {t.home.settings}
            </button>
          </DialogTrigger>
          <DialogContent className='font-sans'>
            <DialogHeader>
              <DialogTitle>{t.home.settings}</DialogTitle>
              <DialogDescription>
                {t.home.settingsDescription}
              </DialogDescription>
            </DialogHeader>
            <label className='flex items-center justify-between gap-4'>
              {t.home.bloodColor}
              <input
                type='color'
                value={bloodColor}
                onChange={(event) => setBloodColor(event.target.value)}
                className='h-10 w-14 cursor-pointer bg-transparent'
              />
            </label>
          </DialogContent>
        </Dialog>
        <button
          type='button'
          className={`${SECONDARY} font-display`}
          aria-label={t.home.changeLanguage}
          onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
        >
          <span
            aria-hidden
            className='text-2xl leading-none'
          >
            {language === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
          </span>{' '}
          {t.home.language}: {t.home.languageName}
        </button>
      </div>
      <InstallApp />
      <p className='relative max-w-xs font-sans text-sm text-white/70'>
        {t.home.instructions}
      </p>
      <footer className='text-outline animate-credit relative mt-auto text-base tracking-wide text-white motion-reduce:animate-none'>
        {t.home.credit}{' '}
        <a
          href='https://github.com/lucashhoffmann/'
          target='_blank'
          rel='noopener noreferrer'
          className='text-[var(--game-brand)] underline-offset-4 hover:underline'
        >
          Hoffmann
        </a>
      </footer>
    </main>
  );
}
