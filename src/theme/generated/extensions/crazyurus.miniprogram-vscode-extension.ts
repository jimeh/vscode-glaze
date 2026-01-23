import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "WeChat Dark": {
    colors: {
      'editor.background': '#2E2E2E',
      'editor.foreground': '#DCDCDC',
      'titleBar.activeBackground': '#424242',
      'titleBar.inactiveBackground': '#424242',
      'statusBar.background': '#383838',
      'statusBar.foreground': '#9B9B9B',
      'activityBar.foreground': '#F7F7F7',
    },
    type: 'dark',
  },
  "WeChat Light": {
    colors: {
      'editor.background': '#FFFFFF',
      'statusBar.background': '#F2F2F2',
      'statusBar.foreground': '#787878',
      'activityBar.background': '#F2F2F2',
      'activityBar.foreground': '#000000',
    },
    type: 'light',
  },
};
