import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Min Dark": {
    colors: {
      'editor.background': '#1F1F1F',
      'titleBar.activeBackground': '#1A1A1A',
      'statusBar.background': '#1A1A1A',
      'statusBar.foreground': '#7E7E7E',
      'activityBar.background': '#1A1A1A',
      'activityBar.foreground': '#7D7D7D',
    },
    type: 'dark',
  },
  "Min Light": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#212121',
      'titleBar.activeBackground': '#F6F6F6',
      'titleBar.inactiveBackground': '#F6F6F6',
      'statusBar.background': '#F6F6F6',
      'statusBar.foreground': '#7E7E7E',
      'activityBar.background': '#F6F6F6',
      'activityBar.foreground': '#9E9E9E',
    },
    type: 'light',
  },
};
