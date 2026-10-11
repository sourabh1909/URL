import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkService } from '../src/services/link.service';
import { AnalyticsService } from '../src/services/analytics.service';
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/middleware/error';

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
  },
}));

describe('LinkService & AnalyticsService Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Link Creation & Conflict Handling (FR-LINK-03, FR-LINK-04)', () => {
    it('creates a link with generated code when no custom alias is provided', async () => {
      (prisma.shortLink.findUnique as any).mockResolvedValue(null);
      (prisma.shortLink.create as any).mockResolvedValue({
        id: 'uuid-1',
        userId: 'user-123',
        shortCode: 'abc123',
        originalUrl: 'https://campusx.in',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await LinkService.createLink({
        userId: 'user-123',
        originalUrl: 'https://campusx.in',
      });

      expect(result.shortCode).toBeDefined();
      expect(result.shortUrl).toContain(result.shortCode);
      expect(result.qrCode).toContain('data:image/png;base64');
    });

    it('throws AppError with 409 CONFLICT if requested custom alias is already taken', async () => {
      (prisma.shortLink.findUnique as any).mockResolvedValue({ id: 'existing-id' });

      await expect(
        LinkService.createLink({
          userId: 'user-123',
          originalUrl: 'https://campusx.in',
          customAlias: 'taken-alias',
        })
      ).rejects.toThrowError(AppError);
    });
  });

  describe('IDOR Prevention & Ownership Enforcement (FR-MGMT-01, FR-MGMT-04, FR-MGMT-06)', () => {
    it('prevents user A from updating user B link (returns 404/NOT_FOUND)', async () => {
      // prisma.shortLink.findFirst with { id, userId: 'user-A' } finds nothing because link belongs to user-B
      (prisma.shortLink.findFirst as any).mockResolvedValue(null);

      await expect(
        LinkService.updateLink({
          userId: 'user-A',
          linkId: 'link-belonging-to-B',
          isActive: false,
        })
      ).rejects.toThrowError(AppError);
    });

    it('prevents user A from deleting user B link (returns 404/NOT_FOUND)', async () => {
      (prisma.shortLink.findFirst as any).mockResolvedValue(null);

      await expect(
        LinkService.deleteLink('user-A', 'link-belonging-to-B')
      ).rejects.toThrowError(AppError);
    });
  });

  describe('Analytics Scoping (FR-AN-06, FR-AN-07)', () => {
    it('returns empty metrics when user has 0 links', async () => {
      (prisma.shortLink.findMany as any).mockResolvedValue([]);

      const overview = await AnalyticsService.getUserOverview('user-empty', '30d');
      expect(overview.totalLinks).toBe(0);
      expect(overview.totalClicks).toBe(0);
      expect(overview.clicksTrend).toEqual([]);
    });

    it('aggregates device, referrer, and country correctly for user links', async () => {
      (prisma.shortLink.findMany as any).mockResolvedValue([
        { id: 'l1', isActive: true },
        { id: 'l2', isActive: true },
      ]);

      (prisma.clickEvent.findMany as any).mockResolvedValue([
        {
          clickedAt: new Date('2026-10-10T10:00:00Z'),
          deviceType: 'desktop',
          referrer: 'github.com',
          countryCode: 'SE',
        },
        {
          clickedAt: new Date('2026-10-10T11:00:00Z'),
          deviceType: 'mobile',
          referrer: 'twitter.com',
          countryCode: 'NO',
        },
        {
          clickedAt: new Date('2026-10-11T12:00:00Z'),
          deviceType: 'desktop',
          referrer: 'direct',
          countryCode: 'SE',
        },
      ]);

      const overview = await AnalyticsService.getUserOverview('user-with-links', '30d');
      expect(overview.totalLinks).toBe(2);
      expect(overview.totalClicks).toBe(3);
      expect(overview.deviceBreakdown).toEqual([
        { name: 'desktop', count: 2 },
        { name: 'mobile', count: 1 },
      ]);
      expect(overview.clicksTrend.length).toBe(2); // 2 distinct dates
    });
  });
});
