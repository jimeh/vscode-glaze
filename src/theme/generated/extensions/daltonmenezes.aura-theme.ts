import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Aura Dark": {
    colors: {
      'editor.background': '#15141B',
      'editor.foreground': '#EDECEE',
      'titleBar.activeBackground': '#121016',
      'titleBar.inactiveBackground': '#2D2B38',
      'statusBar.background': '#121016',
      'statusBar.foreground': '#ADACAE',
      'activityBar.background': '#15141B',
      'activityBar.foreground': '#61FFCA',
    },
    type: 'dark',
  },
  "Aura Dark (Soft Text)": {
    colors: {
      'editor.background': '#15141B',
      'editor.foreground': '#BDBDBD',
      'titleBar.activeBackground': '#121016',
      'titleBar.inactiveBackground': '#2D2B38',
      'statusBar.background': '#121016',
      'statusBar.foreground': '#ADACAE',
      'activityBar.background': '#15141B',
      'activityBar.foreground': '#54C59F',
    },
    type: 'dark',
  },
  "Aura Soft Dark": {
    colors: {
      'editor.background': '#21202E',
      'editor.foreground': '#EDECEE',
      'titleBar.activeBackground': '#121016',
      'titleBar.inactiveBackground': '#2D2B38',
      'statusBar.background': '#1F1A27',
      'statusBar.foreground': '#ADACAE',
      'activityBar.background': '#21202E',
      'activityBar.foreground': '#61FFCA',
    },
    type: 'dark',
  },
  "Aura Soft Dark (Soft Text)": {
    colors: {
      'editor.background': '#21202E',
      'editor.foreground': '#BDBDBD',
      'titleBar.activeBackground': '#121016',
      'titleBar.inactiveBackground': '#2D2B38',
      'statusBar.background': '#1F1A27',
      'statusBar.foreground': '#ADACAE',
      'activityBar.background': '#21202E',
      'activityBar.foreground': '#54C59F',
    },
    type: 'dark',
  },
};
