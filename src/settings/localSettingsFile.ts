import * as vscode from 'vscode';
import { parse, modify, applyEdits } from 'jsonc-parser';
import type { ColorCustomizations } from './colorCustomizations';

/**
 * Relative path to the local settings file within a workspace.
 */
const LOCAL_SETTINGS_PATH = '.vscode/settings.local.json';

/**
 * Returns the URI for .vscode/settings.local.json in the first
 * workspace folder, or undefined if no workspace is open.
 */
function getLocalSettingsUri(): vscode.Uri | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return undefined;
  }
  return vscode.Uri.joinPath(folder.uri, LOCAL_SETTINGS_PATH);
}

/**
 * Read and parse .vscode/settings.local.json. Returns the full
 * parsed object, or undefined if the file does not exist or is
 * empty / unparseable.
 */
async function readLocalSettingsRaw(): Promise<
  Record<string, unknown> | undefined
> {
  const uri = getLocalSettingsUri();
  if (!uri) {
    return undefined;
  }

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const text = new TextDecoder().decode(bytes);
    if (text.trim().length === 0) {
      return undefined;
    }
    const parsed: unknown = parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    // File does not exist or is unreadable.
    return undefined;
  }
}

/**
 * Read the raw text content of .vscode/settings.local.json.
 * Returns undefined if the file does not exist.
 */
async function readLocalSettingsText(): Promise<string | undefined> {
  const uri = getLocalSettingsUri();
  if (!uri) {
    return undefined;
  }

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
}

/**
 * Read workbench.colorCustomizations from
 * .vscode/settings.local.json.
 */
export async function readLocalColorCustomizations(): Promise<
  ColorCustomizations | undefined
> {
  const settings = await readLocalSettingsRaw();
  if (!settings) {
    return undefined;
  }
  const raw = settings['workbench.colorCustomizations'];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as ColorCustomizations;
    return Object.keys(obj).length > 0 ? obj : undefined;
  }
  return undefined;
}

/**
 * Shallow-compare two optional records by key count and value
 * identity. Used to skip redundant file writes.
 */
function shallowEqualRecords(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Write workbench.colorCustomizations to
 * .vscode/settings.local.json. Uses jsonc-parser's modify() to
 * preserve formatting and comments in the file.
 *
 * Returns true on success (or if no write was needed).
 */
export async function writeLocalColorCustomizations(
  value: ColorCustomizations | undefined
): Promise<boolean> {
  const uri = getLocalSettingsUri();
  if (!uri) {
    return false;
  }

  // Re-read to skip redundant writes (prevents reconcile loops).
  const current = await readLocalColorCustomizations();
  const normalized = value && Object.keys(value).length > 0 ? value : undefined;
  if (shallowEqualRecords(current, normalized)) {
    return true;
  }

  try {
    const existing = (await readLocalSettingsText()) ?? '{}';

    // Use jsonc-parser to surgically update only the
    // colorCustomizations key, preserving other keys and
    // formatting.
    const edits = modify(
      existing,
      ['workbench.colorCustomizations'],
      normalized ?? undefined,
      {
        formattingOptions: {
          tabSize: 2,
          insertSpaces: true,
          eol: '\n',
        },
      }
    );
    const updated = applyEdits(existing, edits);

    // If the resulting file is effectively empty (just {}),
    // delete it instead of leaving a stub.
    const parsed: unknown = parse(updated);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Object.keys(parsed as Record<string, unknown>).length === 0
    ) {
      try {
        await vscode.workspace.fs.delete(uri);
      } catch {
        // File may already be gone — that's fine.
      }
      return true;
    }

    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(updated));
    return true;
  } catch (err) {
    console.error('[Glaze] Failed to write settings.local.json:', err);
    return false;
  }
}
