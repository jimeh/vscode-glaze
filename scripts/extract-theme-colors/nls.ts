/**
 * NLS (National Language Support) placeholder resolution.
 *
 * VS Code extensions use package.nls.json files to provide localized
 * strings. Placeholders like `%key%` in package.json are resolved
 * against the NLS data.
 */

/** NLS placeholder pattern: %key% */
const NLS_PLACEHOLDER = /^%([^%]+)%$/;

/**
 * Resolves NLS placeholders in an object tree.
 *
 * Recursively walks the object and replaces string values matching
 * `%key%` with the corresponding value from nlsData. Non-matching
 * strings and unresolved keys pass through unchanged.
 *
 * Returns a new object (immutable pattern).
 *
 * @param obj - Object with potential NLS placeholders
 * @param nlsData - NLS key-value map, or undefined for no-op
 * @returns New object with placeholders resolved
 */
export function resolveNlsPlaceholders<T>(
  obj: T,
  nlsData: Record<string, string> | undefined
): T {
  if (!nlsData || Object.keys(nlsData).length === 0) {
    return obj;
  }

  return resolveValue(obj, nlsData) as T;
}

function resolveValue(
  value: unknown,
  nlsData: Record<string, string>
): unknown {
  if (typeof value === 'string') {
    const match = NLS_PLACEHOLDER.exec(value);
    if (match) {
      const key = match[1];
      return key in nlsData ? nlsData[key] : value;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, nlsData));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = resolveValue(v, nlsData);
    }
    return result;
  }

  return value;
}
