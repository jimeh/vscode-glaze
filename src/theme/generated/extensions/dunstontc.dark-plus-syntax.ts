import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "dark-plus-syntax": {
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'statusBar.background': '#303030',
    },
    type: 'dark',
  },
  "dark-plus-syntax (high contrast)": {
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#FFFFFF',
      'statusBar.background': '#000000',
    },
    type: 'hcDark',
  },
  "light-plus-syntax": {
    colors: {
      'editor.background': '#D4D4D4',
      'editor.foreground': '#1E1E1E',
      'statusBar.background': '#D4D4D4',
      'statusBar.foreground': '#1E1E1E',
      'activityBar.background': '#D4D4D4',
      'activityBar.foreground': '#1E1E1E',
    },
    type: 'light',
  },
  "light-plus-syntax (high contrast)": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'statusBar.background': '#FFFFFF',
      'statusBar.foreground': '#000000',
      'activityBar.background': '#FFFFFF',
      'activityBar.foreground': '#000000',
    },
    type: 'light',
  },
};
