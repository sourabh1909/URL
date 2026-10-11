import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

// Mock prisma for isolated controller & route tests
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    shortLink: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    clickEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('API Route Security and Behavior', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Protection & Authentication (FR-AUTH-05)', () => {
    it('returns 401 Unauthorized for unauthenticated GET /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized for unauthenticated GET /api/links', async () => {
      const res = await request(app).get('/api/links');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized for unauthenticated POST /api/links', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ originalUrl: 'https://example.com' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized for unauthenticated GET /api/analytics/overview', async () => {
      const res = await request(app).get('/api/analytics/overview');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Redirect Endpoint (FR-LINK-08, FR-LINK-09, FR-LINK-10)', () => {
    it('returns 404 for unknown shortCode', async () => {
      (prisma.shortLink.findUnique as any).mockResolvedValue(null);

      const res = await request(app).get('/nonexistent123');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Link not found');
    });

    it('returns 410 for disabled shortCode', async () => {
      (prisma.shortLink.findUnique as any).mockResolvedValue({
        id: 'link-1',
        originalUrl: 'https://example.com',
        isActive: false,
      });

      const res = await request(app).get('/paused-link');
      expect(res.status).toBe(410);
      expect(res.text).toContain('This link is currently disabled');
    });

    it('issues 302 redirect to verified originalUrl for active link', async () => {
      (prisma.shortLink.findUnique as any).mockResolvedValue({
        id: 'link-2',
        originalUrl: 'https://nordic-design.org',
        isActive: true,
      });
      (prisma.clickEvent.create as any).mockResolvedValue({ id: 'click-1' });

      const res = await request(app).get('/active-link');
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('https://nordic-design.org');
    });
  });

  describe('OAuth Callback Validation (FR-AUTH-06)', () => {
    it('rejects callback when state parameter does not match session', async () => {
      const res = await request(app)
        .get('/api/auth/callback/google?code=fake-code&state=mismatched-state');

      // Redirects to /login?error=... to provide friendly user recovery
      expect(res.status).toBe(302);
      expect(res.header.location).toContain('/login?error=');
    });
  });
});
