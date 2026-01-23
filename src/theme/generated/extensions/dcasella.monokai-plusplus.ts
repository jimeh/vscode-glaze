import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Monokai++": {
    colors: {
      'editor.background': '#1C1C1C',
      'editor.foreground': '#CCCCCC',
    },
    type: 'dark',
  },
  "Monokai++ Unified": {
    colors: {
      'editor.background': '#1C1C1C',
      'editor.foreground': '#CCCCCC',
      'statusBar.background': '#1C1C1C',
      'activityBar.background': '#1C1C1C',
    },
    type: 'dark',
  },
};
