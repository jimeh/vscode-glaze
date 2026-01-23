import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Gruvbox Material Dark": {
    colors: {
      'editor.background': '#292828',
      'editor.foreground': '#D4BE98',
      'titleBar.activeBackground': '#292828',
      'titleBar.activeForeground': '#A89984',
      'titleBar.inactiveBackground': '#292828',
      'titleBar.inactiveForeground': '#7C6F64',
      'statusBar.background': '#292828',
      'statusBar.foreground': '#A89984',
      'activityBar.background': '#292828',
      'activityBar.foreground': '#A89984',
    },
    type: 'dark',
  },
  "Gruvbox Material Light": {
    colors: {
      'editor.background': '#FBF1C7',
      'editor.foreground': '#654735',
      'titleBar.activeBackground': '#FBF1C7',
      'titleBar.activeForeground': '#7C6F64',
      'titleBar.inactiveBackground': '#FBF1C7',
      'titleBar.inactiveForeground': '#A89984',
      'statusBar.background': '#FBF1C7',
      'statusBar.foreground': '#7C6F64',
      'activityBar.background': '#FBF1C7',
      'activityBar.foreground': '#7C6F64',
    },
    type: 'light',
  },
};
