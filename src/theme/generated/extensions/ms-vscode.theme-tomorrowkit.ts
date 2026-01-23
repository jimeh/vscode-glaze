import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Tomorrow": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#4D4D4C',
    },
    type: 'light',
  },
  "Tomorrow Night": {
    colors: {
      'editor.background': '#1D1F21',
      'editor.foreground': '#C5C8C6',
    },
    type: 'dark',
  },
  "Tomorrow Night Bright": {
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#DEDEDE',
    },
    type: 'dark',
  },
  "Tomorrow Night Eighties": {
    colors: {
      'editor.background': '#2D2D2D',
      'editor.foreground': '#CCCCCC',
    },
    type: 'dark',
  },
};
