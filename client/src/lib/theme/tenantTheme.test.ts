import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { BrandingPalette, CustomerBranding } from '~/api/customers/types';

import { hexToHslTriplet } from './brandingToCssVars';
import {
  applyCustomerBranding,
  FAVICON_LINK_IDS,
  resetCustomerBranding,
  SYSTEM_APPLE_TOUCH_ICON,
  SYSTEM_DOCUMENT_TITLE,
  SYSTEM_FAVICON,
  TENANT_THEME_STYLE_ID,
} from './tenantTheme';

const PALETTE: BrandingPalette = {
  logoUrl: null,
  logoAlt: 'Elite Beauty Salon',
  primary: { main: '#B92777', light: '#D94C98', dark: '#8E1B5A', contrast: '#FFFFFF' },
  secondary: { main: '#D6FDFF', light: '#EEFEFF', dark: '#9EEFF3', contrast: '#8E1B5A' },
  background: '#FFF7FA',
  foreground: '#2B0A1C',
  surface: '#FFFFFF',
  border: '#F3D3E1',
  mutedForeground: '#7A4A60',
};

function buildCustomer(branding: Partial<CustomerBranding['branding']> = {}): CustomerBranding {
  return {
    id: 'customer-elite',
    displayId: 2,
    name: 'Elite Beauty Salon',
    urlSlug: 'elite-beauty',
    isActive: true,
    branding: {
      favicon32x32: 'http://localhost:3001/uploads/elite-32.png',
      favicon16x16: 'http://localhost:3001/uploads/elite-16.png',
      appleTouch: 'http://localhost:3001/uploads/elite-apple.png',
      documentTitle: 'Elite Beauty Salon',
      theme: { light: PALETTE, dark: PALETTE },
      ...branding,
    },
  };
}

function iconHref(id: string): string | null {
  return document.getElementById(id)?.getAttribute('href') ?? null;
}

describe('tenantTheme', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <link id="${FAVICON_LINK_IDS.favicon32}" rel="icon" href="${SYSTEM_FAVICON}" />
      <link id="${FAVICON_LINK_IDS.favicon16}" rel="icon" href="${SYSTEM_FAVICON}" />
      <link id="${FAVICON_LINK_IDS.appleTouch}" rel="apple-touch-icon" href="${SYSTEM_APPLE_TOUCH_ICON}" />
    `;
    document.title = SYSTEM_DOCUMENT_TITLE;
  });

  afterEach(() => {
    resetCustomerBranding();
  });

  it('writes the salon palette into a single style tag', () => {
    applyCustomerBranding(buildCustomer());
    applyCustomerBranding(buildCustomer());

    const styles = document.head.querySelectorAll(`#${TENANT_THEME_STYLE_ID}`);
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain(`--primary: ${hexToHslTriplet('#B92777')};`);
  });

  it('applies the salon title and icons', () => {
    applyCustomerBranding(buildCustomer());

    expect(document.title).toBe('Elite Beauty Salon');
    expect(iconHref(FAVICON_LINK_IDS.favicon32)).toBe('http://localhost:3001/uploads/elite-32.png');
    expect(iconHref(FAVICON_LINK_IDS.favicon16)).toBe('http://localhost:3001/uploads/elite-16.png');
    expect(iconHref(FAVICON_LINK_IDS.appleTouch)).toBe(
      'http://localhost:3001/uploads/elite-apple.png'
    );
  });

  it('keeps the system favicon and title when the branding has none', () => {
    applyCustomerBranding(
      buildCustomer({ favicon32x32: null, favicon16x16: null, appleTouch: null, documentTitle: '' })
    );

    expect(document.title).toBe(SYSTEM_DOCUMENT_TITLE);
    expect(iconHref(FAVICON_LINK_IDS.favicon32)).toBe(SYSTEM_FAVICON);
    expect(iconHref(FAVICON_LINK_IDS.favicon16)).toBe(SYSTEM_FAVICON);
    expect(iconHref(FAVICON_LINK_IDS.appleTouch)).toBe(SYSTEM_APPLE_TOUCH_ICON);
  });

  it('restores the system theme, title and icons on reset', () => {
    applyCustomerBranding(buildCustomer());
    resetCustomerBranding();

    expect(document.getElementById(TENANT_THEME_STYLE_ID)).toBeNull();
    expect(document.title).toBe(SYSTEM_DOCUMENT_TITLE);
    expect(iconHref(FAVICON_LINK_IDS.favicon32)).toBe(SYSTEM_FAVICON);
  });
});
