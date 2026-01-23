import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Dracula Theme": {
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F8F8F2',
      'titleBar.activeBackground': '#21222C',
      'titleBar.activeForeground': '#F8F8F2',
      'titleBar.inactiveBackground': '#191A21',
      'titleBar.inactiveForeground': '#6272A4',
      'statusBar.background': '#191A21',
      'statusBar.foreground': '#F8F8F2',
      'activityBar.background': '#343746',
      'activityBar.foreground': '#F8F8F2',
    },
    type: 'dark',
  },
  "Dracula Theme Soft": {
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F6F6F4',
      'titleBar.activeBackground': '#262626',
      'titleBar.activeForeground': '#F6F6F4',
      'titleBar.inactiveBackground': '#191A21',
      'titleBar.inactiveForeground': '#7B7F8B',
      'statusBar.background': '#191A21',
      'statusBar.foreground': '#F6F6F4',
      'activityBar.background': '#343746',
      'activityBar.foreground': '#F6F6F4',
    },
    type: 'dark',
  },
};
