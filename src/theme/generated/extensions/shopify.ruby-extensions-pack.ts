import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Spinel": {
    colors: {
      'editor.background': '#2F2F2F',
      'editor.foreground': '#D1CCF1',
      'statusBar.background': '#333333',
    },
    type: 'dark',
  },
  "Spinel Light": {
    colors: {
      'editor.background': '#E3E2EC',
      'editor.foreground': '#595959',
      'statusBar.background': '#98A4BD',
      'activityBar.background': '#E3E2EC',
      'activityBar.foreground': '#595959',
    },
    type: 'light',
  },
};
