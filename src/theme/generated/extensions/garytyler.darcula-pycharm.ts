import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Darcula Pycharm with Dark GUI": {
    colors: {
      'editor.background': '#2B2B2B',
      'titleBar.activeBackground': '#313335',
      'titleBar.inactiveBackground': '#27292A',
      'statusBar.background': '#313335',
      'statusBar.foreground': '#BBBBBB',
      'activityBar.background': '#313335',
      'activityBar.foreground': '#C5C5C5',
    },
    type: 'dark',
  },
  "Darcula Pycharm with Light GUI": {
    colors: {
      'editor.background': '#2B2B2B',
      'titleBar.activeBackground': '#3C3F41',
      'titleBar.inactiveBackground': '#313335',
      'statusBar.background': '#3C3F41',
      'statusBar.foreground': '#BBBBBB',
      'activityBar.background': '#3C3F41',
      'activityBar.foreground': '#F0F0F0',
    },
    type: 'dark',
  },
};
