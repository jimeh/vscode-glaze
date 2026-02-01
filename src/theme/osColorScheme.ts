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

/**
 * Parses Windows `reg query` output to determine color scheme.
 *
 * The registry value AppsUseLightTheme is a REG_DWORD where
 * `0` means dark mode and any non-zero value means light mode.
 *
 * @param output - Raw stdout from `reg query`
 * @returns `'dark'` | `'light'` | `undefined` if value not found
 */
export function parseWindowsRegOutput(
  output: string
): 'dark' | 'light' | undefined {
  const match = output.match(/REG_DWORD\s+(0x[0-9a-fA-F]+)/i);
  if (!match) {
    return undefined;
  }
  const value = parseInt(match[1], 16);
  return value === 0 ? 'dark' : 'light';
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
    return parseWindowsRegOutput(output);
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
