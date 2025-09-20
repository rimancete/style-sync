/**
 * Frontend utility for salon customer URL handling
 * Pattern: /salon/{customer-slug}/...
 */

export class CustomerUrlService {
  /**
   * Extract customer slug from current URL
   * Pattern: /salon/{customer-slug}/...
   */
  static extractCustomerSlug(): string | null {
    const path = window.location.pathname;
    // Pattern: /salon/{customer-slug}/...
    const match = path.match(/^\/salon\/([^\/]+)/);
    return match ? match[1] : null;
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
   * Navigate to customer route
   */
  static navigateToCustomer(customerSlug: string, path: string = '/') {
    const url = this.buildCustomerUrl(customerSlug, path);
    window.location.href = url;
  }

  /**
   * Check if current URL has customer context
   */
  static hasCustomerContext(): boolean {
    return this.extractCustomerSlug() !== null;
  }

}
