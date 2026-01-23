import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Sublime Material Theme - Dark": {
    colors: {
      'editor.background': '#252526',
      'editor.foreground': '#EEFFFF',
    },
    type: 'dark',
  },
  "Sublime Material Theme - Light": {
    colors: {
      'editor.background': '#F3F3F3',
      'editor.foreground': '#80CBC4',
    },
    type: 'light',
  },
};
