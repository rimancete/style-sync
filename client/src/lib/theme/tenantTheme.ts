import type { BrandingTheme, CustomerBranding } from '~/api/customers/types';

import { brandingThemeToCss } from './brandingToCssVars';

export const TENANT_THEME_STYLE_ID = 'tenant-theme';

export const SYSTEM_DOCUMENT_TITLE = 'Style Sync - Barbershop Booking';
export const SYSTEM_FAVICON = '/favicon.ico';
export const SYSTEM_APPLE_TOUCH_ICON = '/logo192.png';

/** Ids of the icon links declared in `index.html`. */
export const FAVICON_LINK_IDS = {
  favicon32: 'favicon-32',
  favicon16: 'favicon-16',
  appleTouch: 'apple-touch-icon',
} as const;

type DocumentBranding = Pick<
  CustomerBranding['branding'],
  'documentTitle' | 'favicon32x32' | 'favicon16x16' | 'appleTouch'
>;

/** Overrides the system palette with a salon's light and dark palettes. */
export function applyTenantTheme(theme: BrandingTheme): void {
  let style = document.getElementById(TENANT_THEME_STYLE_ID);

  if (!style) {
    style = document.createElement('style');
    style.id = TENANT_THEME_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = brandingThemeToCss(theme);
}

export function resetTenantTheme(): void {
  document.getElementById(TENANT_THEME_STYLE_ID)?.remove();
}

/** Sets the salon title and icons; anything missing keeps the system default. */
export function applyDocumentBranding(branding: DocumentBranding): void {
  document.title = branding.documentTitle || SYSTEM_DOCUMENT_TITLE;
  setIconHref(FAVICON_LINK_IDS.favicon32, branding.favicon32x32 ?? SYSTEM_FAVICON);
  setIconHref(FAVICON_LINK_IDS.favicon16, branding.favicon16x16 ?? SYSTEM_FAVICON);
  setIconHref(FAVICON_LINK_IDS.appleTouch, branding.appleTouch ?? SYSTEM_APPLE_TOUCH_ICON);
}

export function resetDocumentBranding(): void {
  applyDocumentBranding({
    documentTitle: SYSTEM_DOCUMENT_TITLE,
    favicon32x32: null,
    favicon16x16: null,
    appleTouch: null,
  });
}

/** Applies the whole salon identity: palette, title and icons. */
export function applyCustomerBranding(customer: CustomerBranding): void {
  applyTenantTheme(customer.branding.theme);
  applyDocumentBranding(customer.branding);
}

export function resetCustomerBranding(): void {
  resetTenantTheme();
  resetDocumentBranding();
}

function setIconHref(id: string, href: string): void {
  const link = document.getElementById(id);

  if (link instanceof HTMLLinkElement) {
    link.href = href;
  }
}
