import { sha256Uint32BE } from '../platform/sha256';

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
  return sha256Uint32BE(str);
}
