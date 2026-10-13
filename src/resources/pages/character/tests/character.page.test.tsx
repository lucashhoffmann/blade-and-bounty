import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { outfitPrice } from '@/app/modules/skins/constants/skins.constants';
import {
  credit,
  readWallet,
  restoreWallet,
} from '@/app/store/game-store/wallet';
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
  // carteira vazia: so a skin padrao
  restoreWallet(null);
  useGameStore.setState({ ...readWallet(), look: DEFAULT_LOOK });
});

describe('CharacterPage', () => {
  it('desenha o look atual no preview ao abrir', () => {
    render(<CharacterPage />);
    expect(setLook).toHaveBeenLastCalledWith(DEFAULT_LOOK);
  });

  it('tocar numa skin mostra ela no preview, mesmo sem ter comprado', async () => {
    render(<CharacterPage />);
    // a skin e a arma que ele veste
    expect(screen.getAllByText('Em uso')).toHaveLength(2);
    await userEvent.click(
      screen.getByRole('button', { name: /Esqueleto guerreiro/ }),
    );
    expect(setLook).toHaveBeenLastCalledWith({
      ...DEFAULT_LOOK,
      outfit: 'skeletonWarrior',
    });
    // so olhou: continua vestindo a de antes
    expect(useGameStore.getState().look.outfit).toBe(DEFAULT_LOOK.outfit);
  });

  it('sem saldo mostra quanto falta; com saldo, compra, desconta e veste', async () => {
    render(<CharacterPage />);
    const price = outfitPrice('rogue');
    expect(screen.queryByRole('button', { name: 'Comprar Ladina' })).toBeNull();
    expect(screen.getAllByText(`Faltam ${price}`).length).toBeGreaterThan(0);

    act(() => useGameStore.setState(credit(price + 3)));
    await userEvent.click(
      screen.getByRole('button', { name: 'Comprar Ladina' }),
    );
    const state = useGameStore.getState();
    expect(state.rubies).toBe(3);
    expect(state.owned).toContain('rogue');
    expect(state.look.outfit).toBe('rogue');
    expect(screen.getByLabelText('Moedas vermelhas: 3')).toBeInTheDocument();
    // o preview acompanha a skin vestida
    expect(setLook).toHaveBeenLastCalledWith({
      ...DEFAULT_LOOK,
      outfit: 'rogue',
    });
  });

  it('skin ja comprada troca com Usar, sem cobrar', async () => {
    act(() => useGameStore.setState(credit(outfitPrice('rogue'))));
    act(() => void useGameStore.getState().buyOutfit('rogue'));
    render(<CharacterPage />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Usar Ladino encapuzado' }),
    );
    expect(useGameStore.getState().look.outfit).toBe('rogueHooded');
    expect(useGameStore.getState().rubies).toBe(0);
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

  it('Voltar retorna ao menu e libera o preview', async () => {
    const { unmount } = render(<CharacterPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(useGameStore.getState().screen).toBe('menu');

    unmount();
    expect(dispose).toHaveBeenCalled();
  });
});
