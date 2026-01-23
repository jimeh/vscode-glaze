import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Material": {
    colors: {
      'editor.background': '#263238',
      'editor.foreground': '#80CBC4',
    },
    type: 'dark',
  },
  "Material Night": {
    colors: {
      'editor.background': '#FAFAFA',
      'editor.foreground': '#90A4AE',
    },
    type: 'light',
  },
  "Material Night Eighties": {
    colors: {
      'editor.background': '#212121',
      'editor.foreground': '#C0C5CE',
    },
    type: 'dark',
  },
};
