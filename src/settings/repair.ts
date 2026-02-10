import * as vscode from 'vscode';

/**
 * Pattern matching an object containing only whitespace and commas,
 * e.g. `{ , }` or `{\n\t,\n}`. This is the specific malformed
 * output VS Code's settings API can produce when removing the last
 * key from a file that had trailing commas.
 */
const EMPTY_OBJECT_WITH_STRAY_COMMAS = /^\{[\s,]*\}[\s]*$/;

/**
 * If the text is an object containing only whitespace and commas
 * (the specific pattern VS Code produces), replace it with `{}\n`.
 * Returns the original text unchanged for anything else.
 */
export function repairJsonc(text: string): string {
  if (EMPTY_OBJECT_WITH_STRAY_COMMAS.test(text)) {
    return '{}\n';
  }
  return text;
}

/**
 * Read the workspace `.vscode/settings.json` and fix it if VS Code's
 * `configuration.update()` left stray commas after removing the last
 * key from a file that had trailing commas (e.g. `{ , }`).
 */
export async function repairWorkspaceSettings(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return;
  }

  const settingsUri = vscode.Uri.joinPath(
    folders[0].uri,
    '.vscode',
    'settings.json'
  );

  let bytes: Uint8Array;
  try {
    bytes = await vscode.workspace.fs.readFile(settingsUri);
  } catch {
    // File does not exist or cannot be read — nothing to repair.
    return;
  }

  const text = new TextDecoder().decode(bytes);
  const repaired = repairJsonc(text);

  if (repaired !== text) {
    try {
      await vscode.workspace.fs.writeFile(
        settingsUri,
        new TextEncoder().encode(repaired)
      );
    } catch {
      // Best-effort — if the write fails there is nothing more
      // we can do.
    }
  }
}
