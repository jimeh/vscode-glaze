import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Vue Theme": {
    colors: {
      'editor.background': '#002B36',
      'editor.foreground': '#E6E6E6',
      'titleBar.activeBackground': '#002B36',
      'titleBar.activeForeground': '#09CBDD',
      'titleBar.inactiveBackground': '#002B36',
      'titleBar.inactiveForeground': '#09CBDD',
      'statusBar.background': '#002B36',
      'statusBar.foreground': '#19F9D8',
      'activityBar.background': '#002B36',
      'activityBar.foreground': '#19F9D8',
    },
    type: 'dark',
  },
  "Vue Theme High Contrast": {
    colors: {
      'editor.background': '#002933',
      'editor.foreground': '#E6E6E6',
      'titleBar.activeBackground': '#002933',
      'titleBar.activeForeground': '#AEB1B0',
      'titleBar.inactiveBackground': '#002933',
      'titleBar.inactiveForeground': '#AEB1B0',
      'statusBar.background': '#002933',
      'statusBar.foreground': '#14C5AB',
      'activityBar.background': '#002933',
      'activityBar.foreground': '#14C5AB',
    },
    type: 'hcDark',
  },
};
