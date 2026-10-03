const FALLBACK_INTERNAL_PATH = '/';

/**
 * Accepts only an in-app relative path. Absolute URLs, protocol-relative
 * hosts, `javascript:`, and backslashes are rejected so a return URL cannot
 * send the browser off-site after login.
 */
export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return false;
  }

  const normalised = value.toLowerCase();

  if (normalised.includes('://') || normalised.includes('javascript:')) {
    return false;
  }

  if (value.includes('\\')) {
    return false;
  }

  return true;
}

export function getSafeInternalPath(value: unknown): string {
  return isSafeInternalPath(value) ? value : FALLBACK_INTERNAL_PATH;
}
