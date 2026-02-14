import { exec } from '../platform/childProcess';
import { promisify } from '../platform/util';

const execAsync = promisify(exec);

/**
 * Detects the operating system's color scheme (dark or light mode).
 *
 * Uses platform-specific shell commands:
 * - macOS: `defaults read -g AppleInterfaceStyle`
 * - Windows: Registry query for AppsUseLightTheme
 * - Linux: `gsettings get org.gnome.desktop.interface color-scheme`
 *
 * All commands are hardcoded strings with no user input, so exec
 * is safe from command injection here.
 *
 * @returns `'dark'` or `'light'` if detected, `undefined` on unsupported
 *   platforms or errors
 */
export async function detectOsColorScheme(): Promise<
  'dark' | 'light' | undefined
> {
  try {
    switch (process.platform) {
      case 'darwin':
        return await detectMacOs();
      case 'win32':
        return await detectWindows();
      case 'linux':
        return await detectLinux();
      default:
        return undefined;
    }
  } catch (err) {
    console.debug('[Glaze] OS color scheme detection failed:', err);
    return undefined;
  }
}

const EXEC_TIMEOUT = 2000;

async function detectMacOs(): Promise<'dark' | 'light'> {
  try {
    const { stdout } = await execAsync('defaults read -g AppleInterfaceStyle', {
      timeout: EXEC_TIMEOUT,
    });
    return stdout.trim().toLowerCase() === 'dark' ? 'dark' : 'light';
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

async function detectWindows(): Promise<'dark' | 'light' | undefined> {
  try {
    const { stdout } = await execAsync(
      'reg query' +
        ' HKCU\\Software\\Microsoft\\Windows' +
        '\\CurrentVersion\\Themes\\Personalize' +
        ' /v AppsUseLightTheme',
      { timeout: EXEC_TIMEOUT }
    );
    return parseWindowsRegOutput(stdout);
  } catch (err) {
    console.debug('[Glaze] Windows color scheme detection failed:', err);
    return undefined;
  }
}

async function detectLinux(): Promise<'dark' | 'light' | undefined> {
  try {
    const { stdout } = await execAsync(
      'gsettings get' + ' org.gnome.desktop.interface color-scheme',
      { timeout: EXEC_TIMEOUT }
    );
    return stdout.toLowerCase().includes('dark') ? 'dark' : 'light';
  } catch (err) {
    console.debug('[Glaze] Linux color scheme detection failed:', err);
    return undefined;
  }
}
