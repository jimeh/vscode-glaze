import * as vscode from 'vscode';
import { parse, type ParseError } from 'jsonc-parser';

/**
 * Detect the indentation unit used in a JSON(C) text.
 * Returns the whitespace string used for one level of indent.
 */
function detectIndent(text: string): string {
  // Look for the first indented line after an opening brace/bracket.
  const match = text.match(/\n(\t+)/);
  if (match) {
    return '\t';
  }
  const spaceMatch = text.match(/\n( +)\S/);
  if (spaceMatch) {
    return spaceMatch[1];
  }
  return '\t';
}

/**
 * Repair a JSONC string that has structural errors such as stray
 * commas. This can happen when VS Code's settings API removes a
 * property from a file that already contained trailing commas —
 * producing patterns like `{ , }` that are invalid even in JSONC.
 *
 * The function is conservative: it returns the original text
 * unchanged when no parse errors are detected (using lenient
 * parsing that allows trailing commas and comments).
 */
export function repairJsonc(text: string): string {
  const errors: ParseError[] = [];
  const value = parse(text, errors, { allowTrailingComma: true });

  // No structural errors → nothing to repair.
  if (errors.length === 0) {
    return text;
  }

  const indent = detectIndent(text);

  // Parsed value is empty/null → return minimal valid JSON.
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  ) {
    return '{}\n';
  }

  // Re-serialize to produce valid JSON, preserving the original
  // indentation style.
  return JSON.stringify(value, null, indent) + '\n';
}

/**
 * Read the workspace `.vscode/settings.json`, check for structural
 * errors, and rewrite the file if a repair is needed. This is a
 * workaround for a VS Code bug where `configuration.update()` can
 * leave stray commas when removing a key from a file that already
 * had trailing commas.
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
