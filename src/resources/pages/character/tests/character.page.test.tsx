import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_LOOK, useGameStore } from '@/app/store/game-store/game.store';
import { CharacterPage } from '@/resources/pages/character/character.page';

// jsdom nao tem WebGL
const { setLook, setWeapon, dispose } = vi.hoisted(() => ({
  setLook: vi.fn(),
  setWeapon: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('@/app/engine/character-preview', () => ({
  createCharacterPreview: vi.fn(() => ({ setLook, setWeapon, dispose })),
}));
vi.mock('@/app/engine/weapon-preview', () => ({
  renderWeaponPreviews: () => ({
    sword: 'data:sword',
    bow: 'data:bow',
    metalBow: 'data:metalBow',
    crossbow: 'data:crossbow',
  }),
}));

beforeEach(() => {
  setLook.mockClear();
  setWeapon.mockClear();
  dispose.mockClear();
  useGameStore.getState().backToMenu();
  useGameStore.getState().openCharacter();
  useGameStore.setState({ look: DEFAULT_LOOK });
});

describe('CharacterPage', () => {
  it('desenha o look atual no preview ao abrir', () => {
    render(<CharacterPage />);
    expect(setLook).toHaveBeenLastCalledWith(DEFAULT_LOOK);
  });

  it('escolher quem voce e grava no store e troca o modelo do preview', async () => {
    render(<CharacterPage />);
    expect(
      screen.getByRole('button', { name: 'Ladino encapuzado' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Maga' }));
    const look = { ...DEFAULT_LOOK, outfit: 'mage' as const };
    expect(useGameStore.getState().look).toEqual(look);
    expect(setLook).toHaveBeenLastCalledWith(look);
    expect(screen.getByRole('button', { name: 'Maga' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('tamanho da arma grava no store e mostra a porcentagem', () => {
    render(<CharacterPage />);
    fireEvent.change(screen.getByLabelText('Arma'), {
      target: { value: '0.8' },
    });
    expect(useGameStore.getState().look.weapon).toBe(0.8);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(setLook).toHaveBeenLastCalledWith({ ...DEFAULT_LOOK, weapon: 0.8 });
  });

  it('abre com a espada e troca a arma do preview pelo seletor', async () => {
    render(<CharacterPage />);
    expect(setWeapon).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('button', { name: 'Espada' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Besta' }));
    expect(setWeapon).toHaveBeenLastCalledWith('crossbow');
    expect(screen.getByRole('button', { name: 'Besta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Espada' }));
    expect(setWeapon).toHaveBeenLastCalledWith(null);
  });

  it('Restaurar padrao desfaz a customizacao', async () => {
    useGameStore.setState({ look: { ...DEFAULT_LOOK, outfit: 'rogue' } });
    render(<CharacterPage />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Restaurar padrao' }),
    );
    expect(useGameStore.getState().look).toEqual(DEFAULT_LOOK);
  });

  it('Voltar retorna ao menu e libera o preview', async () => {
    const { unmount } = render(<CharacterPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(useGameStore.getState().screen).toBe('menu');

    unmount();
    expect(dispose).toHaveBeenCalled();
  });
});
