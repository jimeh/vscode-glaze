import * as vscode from 'vscode';
import { generateNonce } from './nonce';

/**
 * Configuration for a BaseWebviewPanel subclass.
 */
export interface WebviewPanelConfig {
  /**
   * Configuration section prefixes that trigger a re-render
   * when changed (checked via `e.affectsConfiguration()`).
   */
  readonly configSections: readonly string[];
}

/**
 * Abstract base class for webview panels with shared lifecycle
 * management: listener registration, update/dispose cycle, and
 * configuration/theme change handling.
 *
 * Subclasses must implement `generateHtml` and `handleMessage`.
 * The singleton `show()` pattern and static `instance` field stay
 * in each subclass (TypeScript cannot enforce abstract statics).
 */
export abstract class BaseWebviewPanel<TMessage> {
  protected readonly panel: vscode.WebviewPanel;
  protected readonly disposables: vscode.Disposable[] = [];

  private readonly config: WebviewPanelConfig;

  protected constructor(
    panel: vscode.WebviewPanel,
    config: WebviewPanelConfig
  ) {
    this.panel = panel;
    this.config = config;

    void this.update();

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: TMessage) => this.handleMessage(message),
      null,
      this.disposables
    );

    // Re-render when relevant configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        this.onConfigurationChanged(e);
      })
    );

    // Re-render when VS Code theme changes
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        this.onThemeChanged();
        setTimeout(() => void this.update(), 0);
      })
    );
  }

  /**
   * Updates the webview content with current state.
   */
  public async update(): Promise<void> {
    const nonce = generateNonce();
    const cspSource = this.panel.webview.cspSource;

    this.panel.webview.html = await this.generateHtml(nonce, cspSource);
  }

  /**
   * Generates the complete HTML for this panel.
   */
  protected abstract generateHtml(
    nonce: string,
    cspSource: string
  ): Promise<string>;

  /**
   * Handles a message received from the webview.
   */
  protected abstract handleMessage(message: TMessage): void;

  /**
   * Called when the VS Code color theme changes, before `update()`.
   * Override to clear theme-dependent state (e.g. manual theme
   * selection). Default is a no-op.
   */
  protected onThemeChanged(): void {
    // no-op; subclasses may override
  }

  /**
   * Called when workspace configuration changes. Default
   * implementation calls `update()` if any configured section
   * is affected.
   */
  protected onConfigurationChanged(e: vscode.ConfigurationChangeEvent): void {
    const affected = this.config.configSections.some((s) =>
      e.affectsConfiguration(s)
    );
    if (affected) {
      void this.update();
    }
  }

  /**
   * Disposes of the panel and cleans up resources.
   * Subclasses should clear their static `instance` field, then
   * call `super.dispose()`.
   */
  public dispose(): void {
    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
