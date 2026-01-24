import { createHash } from 'crypto';

/**
 * Generates a deterministic numeric hash from a string using SHA-256.
 * Produces well-distributed values with excellent avalanche effect,
 * suitable for deriving hue angles where similar inputs should produce
 * distinctly different outputs.
 *
 * @param str - The string to hash
 * @returns A positive 32-bit integer hash value
 */
export function hashString(str: string): number {
  const hash = createHash('sha256').update(str).digest();
  // Take first 4 bytes as unsigned 32-bit integer
  return hash.readUInt32BE(0);
}
