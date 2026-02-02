/**
 * Applies a hue offset, wrapping to the 0-360 range.
 *
 * @param hue - Base hue angle
 * @param offset - Degrees to add (may be undefined or negative)
 * @returns Wrapped hue angle (0-360)
 */
export function applyHueOffset(hue: number, offset?: number): number {
  return (((hue + (offset ?? 0)) % 360) + 360) % 360;
}
