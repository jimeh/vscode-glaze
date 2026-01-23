import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Tokyo Night": {
    colors: {
      'editor.background': '#1A1B26',
      'editor.foreground': '#A9B1D6',
      'titleBar.activeBackground': '#16161E',
      'titleBar.activeForeground': '#787C99',
      'titleBar.inactiveBackground': '#16161E',
      'titleBar.inactiveForeground': '#787C99',
      'statusBar.background': '#16161E',
      'statusBar.foreground': '#787C99',
      'activityBar.background': '#16161E',
      'activityBar.foreground': '#787C99',
    },
    type: 'dark',
  },
  "Tokyo Night Light": {
    colors: {
      'editor.background': '#E6E7ED',
      'editor.foreground': '#343B59',
      'titleBar.activeBackground': '#D6D8DF',
      'titleBar.activeForeground': '#363C4D',
      'titleBar.inactiveBackground': '#D6D8DF',
      'titleBar.inactiveForeground': '#363C4D',
      'statusBar.background': '#D6D8DF',
      'statusBar.foreground': '#363C4D',
      'activityBar.background': '#D6D8DF',
      'activityBar.foreground': '#363C4D',
    },
    type: 'light',
  },
  "Tokyo Night Storm": {
    colors: {
      'editor.background': '#24283B',
      'editor.foreground': '#A9B1D6',
      'titleBar.activeBackground': '#1F2335',
      'titleBar.activeForeground': '#8089B3',
      'titleBar.inactiveBackground': '#1F2335',
      'titleBar.inactiveForeground': '#8089B3',
      'statusBar.background': '#1F2335',
      'statusBar.foreground': '#8089B3',
      'activityBar.background': '#1F2335',
      'activityBar.foreground': '#8089B3',
    },
    type: 'dark',
  },
};
