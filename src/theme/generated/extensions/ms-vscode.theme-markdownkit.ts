import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Markdown Editor": {
    colors: {
      'editor.background': '#ECECEC',
      'editor.foreground': '#555555',
    },
    type: 'light',
  },
  "Markdown Editor Dark": {
    colors: {
      'editor.background': '#131313',
      'editor.foreground': '#AAAAAA',
    },
    type: 'dark',
  },
  "Markdown Editor Focus": {
    colors: {
      'editor.background': '#CCCCCC',
      'editor.foreground': '#666666',
    },
    type: 'light',
  },
  "Markdown Editor Yellow": {
    colors: {
      'editor.background': '#EFE9B7',
      'editor.foreground': '#705442',
    },
    type: 'light',
  },
};
