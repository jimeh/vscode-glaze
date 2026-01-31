import { execSync } from 'child_process';

/**
 * Detects the operating system's color scheme (dark or light mode).
 *
 * Uses platform-specific shell commands:
 * - macOS: `defaults read -g AppleInterfaceStyle`
 * - Windows: Registry query for AppsUseLightTheme
 * - Linux: `gsettings get org.gnome.desktop.interface color-scheme`
 *
 * All commands are hardcoded strings with no user input, so execSync
 * is safe from command injection here.
 *
 * @returns `'dark'` or `'light'` if detected, `undefined` on unsupported
 *   platforms or errors
 */
export function detectOsColorScheme(): 'dark' | 'light' | undefined {
  try {
    switch (process.platform) {
      case 'darwin':
        return detectMacOs();
      case 'win32':
        return detectWindows();
      case 'linux':
        return detectLinux();
      default:
        return undefined;
    }
  } catch (err) {
    console.debug('[Patina] OS color scheme detection failed:', err);
    return undefined;
  }
}

const EXEC_TIMEOUT = 2000;

function detectMacOs(): 'dark' | 'light' {
  try {
    const output = execSync('defaults read -g AppleInterfaceStyle', {
      timeout: EXEC_TIMEOUT,
      encoding: 'utf-8',
    });
    return output.trim().toLowerCase() === 'dark' ? 'dark' : 'light';
  } catch {
    // Command fails when light mode is active (key doesn't exist)
    return 'light';
  }
}

function detectWindows(): 'dark' | 'light' | undefined {
  try {
    const output = execSync(
      'reg query' +
        ' HKCU\\Software\\Microsoft\\Windows' +
        '\\CurrentVersion\\Themes\\Personalize' +
        ' /v AppsUseLightTheme',
      { timeout: EXEC_TIMEOUT, encoding: 'utf-8' }
    );
    // Output contains "0x0" for dark, "0x1" for light
    return output.includes('0x0') ? 'dark' : 'light';
  } catch (err) {
    console.debug('[Patina] Windows color scheme detection failed:', err);
    return undefined;
  }
}

function detectLinux(): 'dark' | 'light' | undefined {
  try {
    const output = execSync(
      'gsettings get' + ' org.gnome.desktop.interface color-scheme',
      { timeout: EXEC_TIMEOUT, encoding: 'utf-8' }
    );
    return output.toLowerCase().includes('dark') ? 'dark' : 'light';
  } catch (err) {
    console.debug('[Patina] Linux color scheme detection failed:', err);
    return undefined;
  }
}
