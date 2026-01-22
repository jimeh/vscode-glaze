/**
 * Generates a deterministic numeric hash from a string using the djb2
 * algorithm. Produces well-distributed values suitable for deriving hue
 * angles.
 *
 * @param str - The string to hash
 * @returns A positive 32-bit integer hash value
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}
