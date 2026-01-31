const NONCE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random 32-character alphanumeric nonce for CSP.
 */
export function generateNonce(): string {
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += NONCE_CHARS.charAt(Math.floor(Math.random() * NONCE_CHARS.length));
  }
  return nonce;
}
