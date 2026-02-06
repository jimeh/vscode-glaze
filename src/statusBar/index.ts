export type { StatusBarState, TintColors } from './types';
export { StatusBarManager } from './manager';
export { refreshStatusBar } from './refresh';
export {
  capitalizeFirst,
  colorTableRow,
  colorSwatch,
  escapeForMarkdown,
  formatWorkspaceIdForDisplay,
  getStatusText,
  getThemeModeLabel,
  isEffectivelyEnabled,
  isTintActive,
} from './helpers';
