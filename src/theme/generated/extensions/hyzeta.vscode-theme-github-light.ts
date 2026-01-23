import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Github Light Theme": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'titleBar.activeBackground': '#FFFFFF',
      'titleBar.activeForeground': '#000000',
      'titleBar.inactiveBackground': '#FFFFFF',
      'titleBar.inactiveForeground': '#000000',
      'statusBar.background': '#FFFFFF',
      'statusBar.foreground': '#000000',
      'activityBar.background': '#FFFFFF',
      'activityBar.foreground': '#000000',
    },
    type: 'light',
  },
  "Github Light Theme - Gray": {
    colors: {
      'editor.background': '#F0F0F0',
      'editor.foreground': '#000000',
      'titleBar.activeBackground': '#F0F0F0',
      'titleBar.activeForeground': '#000000',
      'titleBar.inactiveBackground': '#F0F0F0',
      'titleBar.inactiveForeground': '#000000',
      'statusBar.background': '#F0F0F0',
      'statusBar.foreground': '#000000',
      'activityBar.background': '#F0F0F0',
      'activityBar.foreground': '#000000',
    },
    type: 'light',
  },
};
