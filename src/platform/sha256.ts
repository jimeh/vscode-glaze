import { createHash } from 'crypto';

/**
 * Computes the first 4 bytes of a SHA-256 digest as an unsigned
 * 32-bit big-endian integer. Used for deterministic hue derivation.
 *
 * Node implementation — delegates to OpenSSL via Node's `crypto`.
 *
 * @param input - UTF-8 string to hash
 * @returns Unsigned 32-bit integer from the first 4 digest bytes
 */
export function sha256Uint32BE(input: string): number {
  return createHash('sha256').update(input).digest().readUInt32BE(0);
}
