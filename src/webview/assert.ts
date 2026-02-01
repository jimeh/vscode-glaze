const HEX_RE = /^#[0-9a-f]{6}$/i;

/**
 * Asserts that a value is a valid 6-digit hex color (e.g. `#a1b2c3`).
 *
 * Throws immediately if the value doesn't match, preventing
 * malformed strings from being interpolated into HTML style
 * attributes.
 */
export function assertHex(hex: string): void {
  if (!HEX_RE.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
}
