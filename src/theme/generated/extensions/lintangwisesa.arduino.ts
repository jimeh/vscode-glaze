import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Arduino Dark": {
    colors: {
      'editor.background': '#282C34',
      'editor.foreground': '#ABB2BF',
      'titleBar.activeBackground': '#266F6F',
      'titleBar.activeForeground': '#FFFFFF',
      'titleBar.inactiveBackground': '#50B5B5',
      'statusBar.background': '#266F6F',
      'statusBar.foreground': '#FFFFFF',
      'activityBar.background': '#339999',
      'activityBar.foreground': '#FFFFFF',
    },
    type: 'dark',
  },
  "Arduino Light": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#3B3A32',
      'titleBar.activeBackground': '#266F6F',
      'titleBar.activeForeground': '#FFFFFF',
      'titleBar.inactiveBackground': '#50B5B5',
      'statusBar.background': '#266F6F',
      'statusBar.foreground': '#FFFFFF',
      'activityBar.background': '#339999',
      'activityBar.foreground': '#FFFFFF',
    },
    type: 'light',
  },
};
