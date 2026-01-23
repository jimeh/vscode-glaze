import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Solarized Dark+": {
    colors: {
      'editor.background': '#002B36',
      'editor.foreground': '#839496',
      'titleBar.activeBackground': '#001F26',
      'titleBar.activeForeground': '#839496',
      'titleBar.inactiveBackground': '#001F26',
      'titleBar.inactiveForeground': '#839496',
      'statusBar.background': '#001B21',
      'statusBar.foreground': '#839496',
      'activityBar.background': '#001F26',
      'activityBar.foreground': '#839496',
    },
    type: 'dark',
  },
  "Solarized Dark+ (High Contrast)": {
    colors: {
      'editor.background': '#002B36',
      'editor.foreground': '#93A1A1',
      'titleBar.activeBackground': '#001F26',
      'titleBar.activeForeground': '#93A1A1',
      'titleBar.inactiveBackground': '#001F26',
      'titleBar.inactiveForeground': '#93A1A1',
      'statusBar.background': '#001B21',
      'statusBar.foreground': '#93A1A1',
      'activityBar.background': '#001F26',
      'activityBar.foreground': '#93A1A1',
    },
    type: 'dark',
  },
  "Solarized Dark+ (Original)": {
    colors: {
      'editor.background': '#002B36',
      'titleBar.activeBackground': '#002C39',
      'statusBar.background': '#00212B',
      'statusBar.foreground': '#93A1A1',
      'activityBar.background': '#003847',
    },
    type: 'dark',
  },
  "Solarized Light+": {
    colors: {
      'editor.background': '#FDF6E3',
      'titleBar.activeBackground': '#EEE8D5',
      'statusBar.background': '#EEE8D5',
      'statusBar.foreground': '#586E75',
      'activityBar.background': '#DDD6C1',
      'activityBar.foreground': '#584C27',
    },
    type: 'light',
  },
  "Solarized Light+ (Original)": {
    colors: {
      'editor.background': '#FDF6E3',
      'titleBar.activeBackground': '#EEE8D5',
      'statusBar.background': '#EEE8D5',
      'statusBar.foreground': '#586E75',
      'activityBar.background': '#DDD6C1',
      'activityBar.foreground': '#584C27',
    },
    type: 'light',
  },
};
