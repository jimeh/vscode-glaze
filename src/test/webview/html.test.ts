import * as assert from 'assert';
import { renderWebviewHtml, type WebviewHtmlOptions } from '../../webview/html';

function createOpts(
  overrides: Partial<WebviewHtmlOptions> = {}
): WebviewHtmlOptions {
  return {
    title: 'Test Panel',
    nonce: 'test-nonce-abc123',
    cspSource: 'https://example.com',
    css: '',
    body: '',
    script: '',
    ...overrides,
  };
}

suite('renderWebviewHtml', () => {
  test('returns valid HTML document structure', () => {
    const html = renderWebviewHtml(createOpts());

    assert.ok(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
    assert.ok(html.includes('<html lang="en">'), 'Should have html tag');
    assert.ok(html.includes('</html>'), 'Should close html tag');
    assert.ok(html.includes('<head>'), 'Should have head section');
    assert.ok(html.includes('</head>'), 'Should close head section');
    assert.ok(html.includes('<body>'), 'Should have body section');
    assert.ok(html.includes('</body>'), 'Should close body section');
  });

  test('includes charset and viewport meta tags', () => {
    const html = renderWebviewHtml(createOpts());

    assert.ok(
      html.includes('<meta charset="UTF-8">'),
      'Should have charset meta'
    );
    assert.ok(
      html.includes(
        '<meta name="viewport" content="width=device-width, ' +
          'initial-scale=1.0">'
      ),
      'Should have viewport meta'
    );
  });

  test('includes CSP meta tag with nonce and cspSource', () => {
    const opts = createOpts({
      nonce: 'my-nonce-42',
      cspSource: 'https://cdn.example.com',
    });
    const html = renderWebviewHtml(opts);

    assert.ok(
      html.includes('Content-Security-Policy'),
      'Should have CSP meta tag'
    );
    assert.ok(
      html.includes("script-src 'nonce-my-nonce-42'"),
      'Should include nonce in CSP'
    );
    assert.ok(
      html.includes('style-src https://cdn.example.com'),
      'Should include cspSource in CSP'
    );
  });

  test('sets document title', () => {
    const html = renderWebviewHtml(createOpts({ title: 'My Custom Title' }));

    assert.ok(
      html.includes('<title>My Custom Title</title>'),
      'Should set the title'
    );
  });

  test('includes base body CSS variables', () => {
    const html = renderWebviewHtml(createOpts());

    assert.ok(
      html.includes('--vscode-font-family'),
      'Should have font-family var'
    );
    assert.ok(html.includes('--vscode-font-size'), 'Should have font-size var');
    assert.ok(
      html.includes('--vscode-foreground'),
      'Should have foreground var'
    );
    assert.ok(
      html.includes('--vscode-editor-background'),
      'Should have background var'
    );
  });

  test('includes custom CSS after base styles', () => {
    const customCss = `
    .my-class {
      color: red;
    }`;
    const html = renderWebviewHtml(createOpts({ css: customCss }));

    assert.ok(html.includes('.my-class'), 'Should include custom CSS');
    // Custom CSS should be inside <style> tag
    const styleStart = html.indexOf('<style>');
    const styleEnd = html.indexOf('</style>');
    const customIndex = html.indexOf('.my-class');
    assert.ok(
      customIndex > styleStart && customIndex < styleEnd,
      'Custom CSS should be inside style tag'
    );
  });

  test('includes body content', () => {
    const body = '<div class="content">Hello World</div>';
    const html = renderWebviewHtml(createOpts({ body }));

    assert.ok(
      html.includes('<div class="content">Hello World</div>'),
      'Should include body content'
    );
    const bodyStart = html.indexOf('<body>');
    const bodyEnd = html.indexOf('</body>');
    const contentIndex = html.indexOf('Hello World');
    assert.ok(
      contentIndex > bodyStart && contentIndex < bodyEnd,
      'Body content should be inside body tag'
    );
  });

  test('includes script with nonce and IIFE wrapper', () => {
    const opts = createOpts({
      nonce: 'script-nonce-99',
      script: 'console.log("hello");',
    });
    const html = renderWebviewHtml(opts);

    assert.ok(
      html.includes('<script nonce="script-nonce-99">'),
      'Script should have nonce attribute'
    );
    assert.ok(html.includes('(function()'), 'Should have IIFE opening');
    assert.ok(html.includes('})();'), 'Should have IIFE closing');
    assert.ok(
      html.includes('console.log("hello");'),
      'Should include script content'
    );
  });

  test('places elements in correct order', () => {
    const opts = createOpts({
      css: '.order-test { }',
      body: '<div id="order-body"></div>',
      script: 'const orderCheck = true;',
    });
    const html = renderWebviewHtml(opts);

    const styleIndex = html.indexOf('<style>');
    const cssIndex = html.indexOf('.order-test');
    const bodyIndex = html.indexOf('<body>');
    const contentIndex = html.indexOf('order-body');
    const scriptIndex = html.indexOf('<script');
    const scriptBodyIndex = html.indexOf('orderCheck');

    assert.ok(styleIndex < cssIndex, 'Style tag should come before custom CSS');
    assert.ok(cssIndex < bodyIndex, 'CSS should come before body');
    assert.ok(bodyIndex < contentIndex, 'Body tag should come before content');
    assert.ok(contentIndex < scriptIndex, 'Content should come before script');
    assert.ok(
      scriptIndex < scriptBodyIndex,
      'Script tag should come before script body'
    );
  });
});
