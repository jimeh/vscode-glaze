import type { ThemeInfo } from '../../colors';

export const THEMES: Record<string, ThemeInfo> = {
  "Night Owl": {
    colors: {
      'editor.background': '#011627',
      'editor.foreground': '#D6DEEB',
      'titleBar.activeBackground': '#011627',
      'titleBar.activeForeground': '#EEEFFF',
      'titleBar.inactiveBackground': '#010E1A',
      'statusBar.background': '#011627',
      'statusBar.foreground': '#5F7E97',
      'activityBar.background': '#011627',
      'activityBar.foreground': '#5F7E97',
    },
    type: 'dark',
  },
  "Night Owl (No Italics)": {
    colors: {
      'editor.background': '#011627',
      'editor.foreground': '#D6DEEB',
      'titleBar.activeBackground': '#011627',
      'titleBar.activeForeground': '#EEEFFF',
      'titleBar.inactiveBackground': '#010E1A',
      'statusBar.background': '#011627',
      'statusBar.foreground': '#5F7E97',
      'activityBar.background': '#011627',
      'activityBar.foreground': '#5F7E97',
    },
    type: 'dark',
  },
  "Night Owl Light": {
    colors: {
      'editor.background': '#FBFBFB',
      'editor.foreground': '#403F53',
      'titleBar.activeBackground': '#F0F0F0',
      'statusBar.background': '#F0F0F0',
      'statusBar.foreground': '#403F53',
      'activityBar.background': '#F0F0F0',
      'activityBar.foreground': '#403F53',
    },
    type: 'light',
  },
  "Night Owl Light (No Italics)": {
    colors: {
      'editor.background': '#FBFBFB',
      'editor.foreground': '#403F53',
      'titleBar.activeBackground': '#F0F0F0',
      'statusBar.background': '#F0F0F0',
      'statusBar.foreground': '#403F53',
      'activityBar.background': '#F0F0F0',
      'activityBar.foreground': '#403F53',
    },
    type: 'light',
  },
};
