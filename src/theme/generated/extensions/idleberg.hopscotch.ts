import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Hopscotch [proofreader]": {
    colors: {
      'editor.background': '#322931',
      'editor.foreground': '#797379',
      'titleBar.activeBackground': '#171015',
      'statusBar.background': '#1290BF',
      'activityBar.background': '#392F4B',
      'activityBar.foreground': '#FFFDE6',
    },
    type: 'dark',
  },
  "Hopscotch Classic": {
    colors: {
      'editor.background': '#322931',
      'editor.foreground': '#B9B5B8',
    },
    type: 'dark',
  },
  "Hopscotch Mono": {
    colors: {
      'editor.background': '#322931',
      'editor.foreground': '#B9B5B8',
      'titleBar.activeBackground': '#171015',
      'statusBar.background': '#171015',
      'activityBar.background': '#171015',
      'activityBar.foreground': '#FFFDE6',
    },
    type: 'dark',
  },
  "Hopscotch Mono [proofreader]": {
    colors: {
      'editor.background': '#322931',
      'editor.foreground': '#797379',
      'titleBar.activeBackground': '#171015',
      'statusBar.background': '#171015',
      'activityBar.background': '#171015',
      'activityBar.foreground': '#FFFDE6',
    },
    type: 'dark',
  },
};
