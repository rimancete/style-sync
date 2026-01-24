import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from '../Icon';
import { Check, X } from '../ListIcons';

describe('Icon', () => {
  it('renders Check icon', () => {
    const { container } = render(<Check />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders X icon', () => {
    const { container } = render(<X />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom className to Check icon', () => {
    const { container } = render(<Check className="text-primary" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('text-primary');
  });

  it('Icon component renders Check through name prop', () => {
    const { container } = render(<Icon name="Check" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('returns null for non-existent icon', () => {
    // @ts-expect-error - Testing invalid icon name
    const { container } = render(<Icon name="NonExistent" />);
    expect(container.firstChild).toBeNull();
  });
});
