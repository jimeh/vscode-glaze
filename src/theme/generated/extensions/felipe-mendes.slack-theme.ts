import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Slack Theme Aubergine Dark": {
    colors: {
      'editor.background': '#3E313C',
      'editor.foreground': '#F6F6F4',
      'titleBar.activeBackground': '#4F384A',
      'titleBar.inactiveBackground': '#261C25',
      'titleBar.inactiveForeground': '#685C66',
      'statusBar.background': '#3E9689',
      'activityBar.background': '#261C25',
      'activityBar.foreground': '#958793',
    },
    type: 'dark',
  },
  "Slack Theme Dark Mode": {
    colors: {
      'editor.background': '#222222',
      'editor.foreground': '#E6E6E6',
      'titleBar.activeBackground': '#222222',
      'titleBar.activeForeground': '#E6E6E6',
      'titleBar.inactiveBackground': '#222222',
      'titleBar.inactiveForeground': '#7A7A7A',
      'statusBar.background': '#222222',
      'activityBar.background': '#222222',
    },
    type: 'dark',
  },
};
