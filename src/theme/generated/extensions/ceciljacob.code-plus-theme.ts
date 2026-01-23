import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Theme + Dark Blue Theme": {
    colors: {
      'editor.background': '#081620',
      'editor.foreground': '#F6FAFD',
      'titleBar.activeBackground': '#081620',
      'titleBar.activeForeground': '#F6FAFD',
      'titleBar.inactiveBackground': '#081620',
      'titleBar.inactiveForeground': '#F6FAFD',
      'statusBar.background': '#081620',
      'statusBar.foreground': '#DFECF6',
      'activityBar.background': '#081620',
      'activityBar.foreground': '#9BC4E2',
    },
    type: 'dark',
  },
  "Theme + Dark Brown Theme": {
    colors: {
      'editor.background': '#180F08',
      'editor.foreground': '#FCFAF6',
      'titleBar.activeBackground': '#180F08',
      'titleBar.activeForeground': '#FCFAF6',
      'titleBar.inactiveBackground': '#180F08',
      'titleBar.inactiveForeground': '#FCFAF6',
      'statusBar.background': '#180F08',
      'statusBar.foreground': '#F6ECE0',
      'activityBar.background': '#180F08',
      'activityBar.foreground': '#D2A67B',
    },
    type: 'dark',
  },
};
