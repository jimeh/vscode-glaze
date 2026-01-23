import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Shades of Purple": {
    colors: {
      'editor.background': '#2D2B55',
      'editor.foreground': '#FFFFFF',
      'titleBar.activeBackground': '#1E1E3F',
      'titleBar.activeForeground': '#FFFFFF',
      'titleBar.inactiveBackground': '#1E1E3F',
      'titleBar.inactiveForeground': '#A599E9',
      'statusBar.background': '#1E1E3F',
      'statusBar.foreground': '#A599E9',
      'activityBar.background': '#28284E',
      'activityBar.foreground': '#FFFFFF',
    },
    type: 'dark',
  },
  "Shades of Purple (Super Dark)": {
    colors: {
      'editor.background': '#191830',
      'editor.foreground': '#FFFFFF',
      'titleBar.activeBackground': '#15152B',
      'titleBar.activeForeground': '#FFFFFF',
      'titleBar.inactiveBackground': '#15152B',
      'titleBar.inactiveForeground': '#A599E9',
      'statusBar.background': '#15152B',
      'statusBar.foreground': '#A599E9',
      'activityBar.background': '#15152A',
      'activityBar.foreground': '#FFFFFF',
    },
    type: 'dark',
  },
};
