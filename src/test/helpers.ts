import type { TintTarget } from '../config';
import type { ThemeType, ThemeContext, ThemeColors } from '../theme';

/** All tint targets for parametric tests. */
export const ALL_TARGETS: TintTarget[] = [
  'titleBar',
  'statusBar',
  'activityBar',
];

/**
 * Creates a ThemeContext for testing.
 */
export function makeThemeContext(
  tintType: ThemeType,
  options?: { colors?: ThemeColors }
): ThemeContext {
  return {
    tintType,
    isAutoDetected: true,
    colors: options?.colors,
  };
}
