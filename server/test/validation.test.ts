import { describe, it, expect } from 'vitest';
import { isValidHttpUrl, createLinkSchema, checkAliasSchema } from '../src/schemas/link.schema';

describe('URL Validation and Safety (FR-LINK-01)', () => {
  it('accepts standard http and https URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('http://subdomain.test.org/path?q=1#hash')).toBe(true);
    expect(isValidHttpUrl('https://google.com/search?q=nordlink')).toBe(true);
  });

  it('rejects unsupported or dangerous schemes', () => {
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isValidHttpUrl('ftp://example.com/file')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });

  it('createLinkSchema validates valid input and rejects invalid schemas', () => {
    const valid = createLinkSchema.safeParse({
      originalUrl: 'https://github.com/trending',
      customAlias: 'github-trend',
    });
    expect(valid.success).toBe(true);

    const invalidScheme = createLinkSchema.safeParse({
      originalUrl: 'javascript:window.location="https://evil.com"',
    });
    expect(invalidScheme.success).toBe(false);

    const reservedAlias = createLinkSchema.safeParse({
      originalUrl: 'https://example.com',
      customAlias: 'dashboard',
    });
    expect(reservedAlias.success).toBe(false);
  });

  it('checkAliasSchema enforces length and character restrictions and disallows reserved words', () => {
    expect(checkAliasSchema.safeParse({ alias: 'my-link-123' }).success).toBe(true);
    expect(checkAliasSchema.safeParse({ alias: 'ab' }).success).toBe(false); // too short (<3)
    expect(checkAliasSchema.safeParse({ alias: 'invalid space' }).success).toBe(false);
    expect(checkAliasSchema.safeParse({ alias: 'api' }).success).toBe(false); // reserved
    expect(checkAliasSchema.safeParse({ alias: 'login' }).success).toBe(false); // reserved
  });
});
