import nearestColor from 'nearest-color';
import colornameMap from './colornames.json';

// The JSON is a hex -> name mapping (hex without #)
type ColorNameMap = Record<string, string>;

// Singleton: build lookup once, lazy-loaded
let nearestFn: ReturnType<typeof nearestColor.from> | null = null;
const cache = new Map<string, string>();

function getNearestFn(): ReturnType<typeof nearestColor.from> {
  if (!nearestFn) {
    // Convert hex -> name map to name -> hex map for nearest-color.
    // Double assertion needed: resolveJsonModule infers narrow literal
    // types for the ~5000 JSON entries. Alternatives (.d.ts override is
    // fragile, Object.fromEntries copies at runtime) have worse tradeoffs.
    const colors: Record<string, string> = {};
    for (const [hex, name] of Object.entries(
      colornameMap as unknown as ColorNameMap
    )) {
      colors[name] = `#${hex}`;
    }
    nearestFn = nearestColor.from(colors);
  }
  return nearestFn;
}

/**
 * Gets a human-readable color name for a hex color.
 * Uses nearest-color matching against a curated list of ~5000 color names.
 */
export function getColorName(hex: string): string {
  const normalized = hex.toLowerCase();
  const cached = cache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  const result = getNearestFn()(normalized);
  const name = result?.name ?? 'Unknown';
  cache.set(normalized, name);
  return name;
}
