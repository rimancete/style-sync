import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  /**
   * Number of requests allowed per time window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  ttl: number;
  /**
   * Custom message for rate limit exceeded
   */
  message?: string;
}

/**
 * Decorator to set custom rate limiting for specific endpoints
 *
 * @param options Rate limiting configuration
 *
 * @example
 * // Allow 10 requests per minute for branding endpoint
 * @RateLimit({ limit: 10, ttl: 60 })
 * @Get('branding/:urlSlug')
 * getBranding() { ... }
 *
 * @example
 * // Stricter limits for sensitive endpoints
 * @RateLimit({ limit: 3, ttl: 60, message: 'Login attempts exceeded' })
 * @Post('auth/login')
 * login() { ... }
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
