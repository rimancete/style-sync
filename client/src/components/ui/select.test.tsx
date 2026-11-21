import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '~/test/utils';

import { Select } from './select';

const ITEMS = [
  { value: 'customer-acme', label: 'Acme Barbershop' },
  { value: 'customer-elite', label: 'Elite Beauty Salon' },
];

describe('Select', () => {
  it('renders the selected item label from the items list', () => {
    render(
      <Select
        items={ITEMS}
        value="customer-acme"
        onValueChange={vi.fn()}
        aria-label="Company"
        placeholder="Pick a company"
      />
    );

    expect(screen.getByLabelText('Company')).toHaveTextContent('Acme Barbershop');
  });

  it('calls onValueChange with the item value when an option is chosen', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select
        items={ITEMS}
        value="customer-acme"
        onValueChange={onValueChange}
        aria-label="Company"
      />
    );

    await user.click(screen.getByLabelText('Company'));
    await user.click(await screen.findByRole('option', { name: 'Elite Beauty Salon' }));

    expect(onValueChange).toHaveBeenCalledWith('customer-elite');
  });
});
