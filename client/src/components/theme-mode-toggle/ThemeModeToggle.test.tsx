import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeStore } from '~/store/themeStore';
import { render, screen } from '~/test/utils';

import { ThemeModeToggle } from './ThemeModeToggle';

import '~/i18n/config';

describe('ThemeModeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ preference: null, systemMode: 'light', mode: 'light' });
  });

  it('reports the current mode through aria-pressed', () => {
    render(<ThemeModeToggle />);

    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('switches to dark mode and saves the choice', async () => {
    const user = userEvent.setup();
    render(<ThemeModeToggle />);

    await user.click(screen.getByRole('button', { name: 'Dark mode' }));

    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(useThemeStore.getState().preference).toBe('dark');
  });
});
