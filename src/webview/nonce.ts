import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP.
 *
 * Uses `crypto.randomBytes` instead of `Math.random` for
 * unpredictable output suitable for Content-Security-Policy.
 */
export function generateNonce(): string {
  return randomBytes(24).toString('base64url');
}
