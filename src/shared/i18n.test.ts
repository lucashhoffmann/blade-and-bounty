import { createWorld } from '@/app/modules/world/systems/world.system';
import { getTexts, translateSessionError, useLanguage } from '@/shared/i18n';

it('mantem o registro da partida nos dois idiomas para cada jogador', () => {
  const world = createWorld(1);
  expect(world.run.events[0]).toMatchObject({
    text: 'Caçada iniciada.',
    en: 'Bounty started.',
  });

  useLanguage.getState().setLanguage('en');
  expect(getTexts().shop.items.bow).toBe('Bow');
  expect(translateSessionError('Sessao cheia.')).toBe('Session is full.');
  useLanguage.getState().setLanguage('pt-BR');
});
