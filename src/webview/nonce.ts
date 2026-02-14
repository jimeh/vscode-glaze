/** Base64url alphabet (RFC 4648 §5). */
const B64URL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Generates a cryptographically secure nonce for CSP.
 *
 * Uses `globalThis.crypto.getRandomValues` for unpredictable
 * output suitable for Content-Security-Policy. Works in both
 * Node.js (≥19) and browser environments.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);

  // Encode 24 bytes → 32 base64url characters (no padding needed).
  let result = '';
  for (let i = 0; i < 24; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    result += B64URL[a >> 2];
    result += B64URL[((a & 3) << 4) | (b >> 4)];
    result += B64URL[((b & 15) << 2) | (c >> 6)];
    result += B64URL[c & 63];
  }

  return result;
}
