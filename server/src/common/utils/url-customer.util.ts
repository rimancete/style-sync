/**
 * URL-based customer context utilities
 * Supports both prefixed (/c/{slug}) and direct (/{slug}) URL patterns
 */

export class CustomerUrlUtil {
  // Reserved system routes that cannot be customer slugs
  private static readonly RESERVED_ROUTES = [
    'admin',
    'api',
    'health',
    'auth',
    'docs',
    'swagger',
    'about',
    'pricing',
    'contact',
    'terms',
    'privacy',
    'login',
    'register',
    'salon', // salon prefix route
  ];

  /**
   * Extract customer slug from URL path
   * Pattern: /salon/{customer-slug}/dashboard
   */
  static extractCustomerSlug(urlPath: string): string | null {
    // Pattern: /salon/{customer-slug}/... or /api/salon/{customer-slug}/...
    const salonMatch = urlPath.match(/^(?:\/api)?\/salon\/([^/]+)/);
    return salonMatch ? salonMatch[1] : null;
  }

  /**
   * Build salon customer URL
   * Pattern: /salon/{customer-slug}/path
   */
  static buildCustomerUrl(customerSlug: string, path: string = '/'): string {
    const basePath = `/salon/${customerSlug}`;
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${fullPath === '/' ? '' : fullPath}`;
  }

  /**
   * Validate if a slug can be used as a customer identifier
   */
  static isValidCustomerSlug(slug: string): boolean {
    // Check against reserved routes
    if (this.RESERVED_ROUTES.includes(slug.toLowerCase())) {
      return false;
    }

    // Basic validation: alphanumeric, hyphens, underscores
    const validPattern = /^[a-z0-9-_]+$/i;
    return validPattern.test(slug) && slug.length >= 2 && slug.length <= 50;
  }

  /**
   * Get all reserved routes (for validation)
   */
  static getReservedRoutes(): string[] {
    return [...this.RESERVED_ROUTES];
  }
}
