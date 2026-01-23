import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Visual Studio 2017 Dark - C++": {
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
    },
    type: 'dark',
  },
  "Visual Studio 2017 Light - C++": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
    },
    type: 'light',
  },
  "Visual Studio Dark - C++": {
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#DADADA',
    },
    type: 'dark',
  },
  "Visual Studio Light - C++": {
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
    },
    type: 'light',
  },
};
