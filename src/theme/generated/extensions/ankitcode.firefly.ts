import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "FireFly Pro": {
    colors: {
      'editor.background': '#0A0F17',
      'editor.foreground': '#BAC6DB',
      'titleBar.activeBackground': '#000000',
      'titleBar.activeForeground': '#A8AEBD',
      'titleBar.inactiveBackground': '#474747',
      'titleBar.inactiveForeground': '#C2C2C2',
      'statusBar.background': '#0E1421',
      'statusBar.foreground': '#787E8D',
      'activityBar.background': '#0E1421',
      'activityBar.foreground': '#FDFEFE',
    },
    type: 'dark',
  },
  "FireFly Pro Bright": {
    colors: {
      'editor.background': '#0A0A0A',
      'editor.foreground': '#B3B8C5',
      'titleBar.activeBackground': '#000000',
      'titleBar.activeForeground': '#A8AEBD',
      'titleBar.inactiveBackground': '#474747',
      'titleBar.inactiveForeground': '#C2C2C2',
      'statusBar.background': '#000000',
      'statusBar.foreground': '#787E8D',
      'activityBar.background': '#000000',
      'activityBar.foreground': '#A4BD00',
    },
    type: 'dark',
  },
  "FireFly Pro Midnight": {
    colors: {
      'editor.background': '#151515',
      'editor.foreground': '#B3B8C5',
      'titleBar.activeBackground': '#191823',
      'titleBar.activeForeground': '#A8AEBD',
      'titleBar.inactiveBackground': '#3D3B57',
      'titleBar.inactiveForeground': '#B7B7B7',
      'statusBar.background': '#191823',
      'statusBar.foreground': '#787E8D',
      'activityBar.background': '#191823',
      'activityBar.foreground': '#A4BD00',
    },
    type: 'dark',
  },
};
