import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Monokai Night": {
    colors: {
      'editor.background': '#1F1F1F',
      'editor.foreground': '#DDDDDD',
      'titleBar.activeBackground': '#161616',
      'titleBar.activeForeground': '#DDDDDD',
      'titleBar.inactiveBackground': '#161616',
      'titleBar.inactiveForeground': '#666666',
      'statusBar.background': '#161616',
      'statusBar.foreground': '#DDDDDD',
      'activityBar.background': '#0F0F0F',
      'activityBar.foreground': '#DDDDDD',
    },
    type: 'dark',
  },
};
