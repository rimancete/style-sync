/**
 * Builds an unsigned JWT that `jwt-decode` can read.
 * These tokens are for MSW and unit tests only — they are never sent to the API.
 */
export function createUnsignedJwt(payload: Record<string, unknown>): string {
  const header = encodeSegment({ alg: 'none', typ: 'JWT' });
  const body = encodeSegment(payload);
  return `${header}.${body}.signature`;
}

function encodeSegment(value: Record<string, unknown>): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}
