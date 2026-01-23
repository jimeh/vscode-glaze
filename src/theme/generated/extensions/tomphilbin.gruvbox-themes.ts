import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Gruvbox Dark (Hard)": {
    colors: {
      'editor.background': '#1D2021',
      'editor.foreground': '#EBDBB2',
    },
    type: 'dark',
  },
  "Gruvbox Dark (Medium)": {
    colors: {
      'editor.background': '#282828',
      'editor.foreground': '#EBDBB2',
    },
    type: 'dark',
  },
  "Gruvbox Dark (Soft)": {
    colors: {
      'editor.background': '#32302F',
      'editor.foreground': '#EBDBB2',
    },
    type: 'dark',
  },
  "Gruvbox Light (Hard)": {
    colors: {
      'editor.background': '#F9F5D7',
      'editor.foreground': '#3C3836',
    },
    type: 'light',
  },
  "Gruvbox Light (Medium)": {
    colors: {
      'editor.background': '#FBF1C7',
      'editor.foreground': '#3C3836',
    },
    type: 'light',
  },
  "Gruvbox Light (Soft)": {
    colors: {
      'editor.background': '#F2E5BC',
      'editor.foreground': '#3C3836',
    },
    type: 'light',
  },
};
