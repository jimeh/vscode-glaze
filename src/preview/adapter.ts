import type { TintResult } from '../color/tint';
import type { StylePreviewColors } from './types';

/**
 * Extracts preview colors for titleBar, statusBar, activityBar,
 * and sideBar from a TintResult.
 *
 * Uses active titleBar keys (not inactive variants) to match
 * what the preview panel displays.
 */
export function tintResultToPreviewColors(
  result: TintResult
): StylePreviewColors {
  let titleBarBg = '';
  let titleBarFg = '';
  let statusBarBg = '';
  let statusBarFg = '';
  let activityBarBg = '';
  let activityBarFg = '';
  let sideBarBg = '';
  let sideBarFg = '';

  for (const detail of result.keys) {
    switch (detail.key) {
      case 'titleBar.activeBackground':
        titleBarBg = detail.finalHex;
        break;
      case 'titleBar.activeForeground':
        titleBarFg = detail.finalHex;
        break;
      case 'statusBar.background':
        statusBarBg = detail.finalHex;
        break;
      case 'statusBar.foreground':
        statusBarFg = detail.finalHex;
        break;
      case 'activityBar.background':
        activityBarBg = detail.finalHex;
        break;
      case 'activityBar.foreground':
        activityBarFg = detail.finalHex;
        break;
      case 'sideBar.background':
        sideBarBg = detail.finalHex;
        break;
      case 'sideBar.foreground':
        sideBarFg = detail.finalHex;
        break;
    }
  }

  return {
    titleBar: { background: titleBarBg, foreground: titleBarFg },
    statusBar: { background: statusBarBg, foreground: statusBarFg },
    activityBar: {
      background: activityBarBg,
      foreground: activityBarFg,
    },
    sideBar: { background: sideBarBg, foreground: sideBarFg },
  };
}
