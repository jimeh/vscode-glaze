import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Darcula": {
    colors: {
      'editor.background': '#242424',
      'editor.foreground': '#CCCCCC',
      'titleBar.activeBackground': '#FFFFFF',
      'titleBar.activeForeground': '#CCCCCC',
      'titleBar.inactiveBackground': '#FFFFFF',
      'statusBar.background': '#FFFFFF',
      'statusBar.foreground': '#CCCCCC',
      'activityBar.background': '#FFFFFF',
    },
    type: 'dark',
  },
};
