import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    // Use IP address as the primary tracker
    const clientIp = this.getClientIp(req);

    // For branding endpoints, also consider the URL slug to prevent
    // targeted attacks on specific customers
    if (req.url.includes('/branding/')) {
      const urlSlug = req.params?.urlSlug || 'unknown';
      return Promise.resolve(`${clientIp}:${urlSlug}`);
    }

    return Promise.resolve(clientIp);
  }

  private getClientIp(req: Request): string {
    // Handle various proxy configurations
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    const xRealIp = req.headers['x-real-ip'] as string;

    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return xForwardedFor.split(',')[0].trim();
    }

    if (xRealIp) {
      return xRealIp;
    }

    // Fallback to connection remote address
    return req.socket.remoteAddress || 'unknown';
  }

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: { limit: number; ttl: number },
  ): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // Log potential DDoS attempts for monitoring
    // eslint-disable-next-line no-console
    console.warn(
      `Rate limit exceeded for IP: ${clientIp}, URL: ${request.url}`,
      {
        ip: clientIp,
        url: request.url,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
        limit: throttlerLimitDetail.limit,
        ttl: throttlerLimitDetail.ttl,
      },
    );

    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
