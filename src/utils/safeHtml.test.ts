import { extractPlainText, sanitizeHtml } from './safeHtml';

describe('safeHtml', () => {
  it('removes scripts, inline handlers, and unsafe URLs', () => {
    const sanitized = sanitizeHtml(
      '<div onclick="alert(1)"><script>alert(1)</script><img src="x" onerror="alert(1)" /><a href="javascript:alert(1)">bad</a><span>safe</span></div>',
    );

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('<span>safe</span>');
  });

  it('extracts readable plain text from rich content', () => {
    expect(extractPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });
});
