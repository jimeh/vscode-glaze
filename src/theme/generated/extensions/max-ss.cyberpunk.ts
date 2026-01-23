import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Activate SCARLET protocol (beta)": {
    colors: {
      'editor.background': '#101116',
      'editor.foreground': '#FF0055',
      'titleBar.activeBackground': '#140009',
      'titleBar.activeForeground': '#FF8BA8',
      'statusBar.background': '#1D000A',
      'statusBar.foreground': '#FF0055',
      'activityBar.background': '#101116',
      'activityBar.foreground': '#FF0055',
    },
    type: 'dark',
  },
  "Activate UMBRA protocol": {
    colors: {
      'editor.background': '#100D23',
      'editor.foreground': '#00FF9C',
      'titleBar.activeBackground': '#100D23',
      'titleBar.activeForeground': '#00FF9C',
      'titleBar.inactiveBackground': '#1E1D45',
      'titleBar.inactiveForeground': '#00FF9C',
      'statusBar.background': '#002212',
      'statusBar.foreground': '#00FF9C',
      'activityBar.background': '#100D23',
      'activityBar.foreground': '#00FF9D',
    },
    type: 'dark',
  },
  "Cyberpunk": {
    colors: {
      'editor.background': '#261D45',
      'editor.foreground': '#00FF9C',
      'titleBar.activeBackground': '#100D23',
      'titleBar.activeForeground': '#00FF9C',
      'titleBar.inactiveBackground': '#1E1D45',
      'titleBar.inactiveForeground': '#00FF9C',
      'statusBar.background': '#002212',
      'statusBar.foreground': '#00FF9C',
      'activityBar.background': '#261D45',
      'activityBar.foreground': '#00FFC8',
    },
    type: 'dark',
  },
};
