import * as vscode from 'vscode';

let outputChannel: vscode.LogOutputChannel | undefined;
let levelChangeDisposable: vscode.Disposable | undefined;

function getOutputChannel(): vscode.LogOutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Glaze', {
      log: true,
    });
    levelChangeDisposable = outputChannel.onDidChangeLogLevel((level) => {
      outputChannel!.info(`Log level changed to: ${vscode.LogLevel[level]}`);
    });
  }
  return outputChannel;
}

/**
 * Dispose the output channel.
 * Call during extension deactivation.
 */
export function disposeLogger(): void {
  levelChangeDisposable?.dispose();
  levelChangeDisposable = undefined;
  outputChannel?.dispose();
  outputChannel = undefined;
}

/**
 * Logger methods delegating to LogOutputChannel.
 * Level filtering is handled natively by VS Code — users
 * control verbosity via the Output panel's level dropdown.
 */
export const log = {
  trace(message: string, ...args: any[]): void {
    getOutputChannel().trace(message, ...args);
  },
  debug(message: string, ...args: any[]): void {
    getOutputChannel().debug(message, ...args);
  },
  info(message: string, ...args: any[]): void {
    getOutputChannel().info(message, ...args);
  },
  warn(message: string, ...args: any[]): void {
    getOutputChannel().warn(message, ...args);
  },
  error(message: string, ...args: any[]): void {
    getOutputChannel().error(message, ...args);
    console.error('[Glaze]', message, ...args);
  },
};

/**
 * Reset logger state. Test isolation only.
 * Does not dispose the output channel — VS Code reuses
 * channel instances by name, and disposing makes the
 * shared instance unusable for subsequent tests.
 */
export function _resetLoggerState(): void {
  // No internal state to reset — LogOutputChannel manages
  // its own level filtering.
}
