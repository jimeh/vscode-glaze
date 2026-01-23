import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Night Owl Black": {
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#D6DEEB',
      'titleBar.activeBackground': '#011627',
      'titleBar.activeForeground': '#EEEFFF',
      'titleBar.inactiveBackground': '#010E1A',
      'statusBar.background': '#131313',
      'statusBar.foreground': '#8BADC1',
      'activityBar.background': '#131313',
      'activityBar.foreground': '#A599E9',
    },
    type: 'dark',
  },
  "Night Owl Black (No Italics)": {
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#D6DEEB',
      'titleBar.activeBackground': '#011627',
      'titleBar.activeForeground': '#EEEFFF',
      'titleBar.inactiveBackground': '#010E1A',
      'statusBar.background': '#131313',
      'statusBar.foreground': '#8BADC1',
      'activityBar.background': '#131313',
      'activityBar.foreground': '#A599E9',
    },
    type: 'dark',
  },
};
