import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Firefox Dark": {
    colors: {
      'editor.background': '#2A2A2E',
      'editor.foreground': '#B1B1B3',
      'titleBar.activeBackground': '#1B1B1D',
      'titleBar.activeForeground': '#FFFFFF',
      'titleBar.inactiveBackground': '#0C0C0D',
      'titleBar.inactiveForeground': '#B1B1B3',
      'statusBar.background': '#0C0C0D',
      'statusBar.foreground': '#B1B1B3',
      'activityBar.background': '#1B1B1D',
      'activityBar.foreground': '#FFFFFF',
    },
    type: 'dark',
  },
  "Firefox Light": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#4A4A4F',
      'statusBar.background': '#F9F9FA',
      'statusBar.foreground': '#4A4A4F',
      'activityBar.background': '#F9F9FA',
      'activityBar.foreground': '#939393',
    },
    type: 'light',
  },
};
