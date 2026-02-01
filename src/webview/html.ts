/**
 * Options for rendering a webview HTML document shell.
 */
export interface WebviewHtmlOptions {
  /** Document title */
  readonly title: string;
  /** CSP nonce for inline scripts */
  readonly nonce: string;
  /** CSP source for styles (webview.cspSource) */
  readonly cspSource: string;
  /** Domain-specific CSS (inserted after base body reset) */
  readonly css: string;
  /** Body HTML content */
  readonly body: string;
  /** Script body (inserted inside an IIFE with nonce) */
  readonly script: string;
}

/**
 * Renders a complete webview HTML document with shared boilerplate.
 *
 * Provides: DOCTYPE, charset, viewport, CSP meta tag, base body CSS
 * reset, and a nonce-guarded script IIFE wrapper. Each panel supplies
 * its own CSS, body content, and script logic.
 */
export function renderWebviewHtml(opts: WebviewHtmlOptions): string {
  const { title, nonce, cspSource, css, body, script } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>${title}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }
${css}
  </style>
</head>
<body>
  ${body}

  <script nonce="${nonce}">
    (function() {
      ${script}
    })();
  </script>
</body>
</html>`;
}
