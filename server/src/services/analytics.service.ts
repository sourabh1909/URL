import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error';

export type TimeRange = '7d' | '30d' | '90d' | 'all';

function getDateThreshold(range: TimeRange): Date | null {
  const now = new Date();
  if (range === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (range === '90d') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  return null;
}

export class AnalyticsService {
  /**
   * Retrieves high-level overview metrics across all user's links
   */
  static async getUserOverview(userId: string, range: TimeRange = '30d') {
    const since = getDateThreshold(range);

    const userLinks = await prisma.shortLink.findMany({
      where: { userId },
      select: { id: true, isActive: true },
    });

    const linkIds = userLinks.map((l: { id: string; isActive: boolean }) => l.id);
    const totalLinks = userLinks.length;
    const activeLinks = userLinks.filter((l: { id: string; isActive: boolean }) => l.isActive).length;

    if (linkIds.length === 0) {
      return {
        totalLinks: 0,
        activeLinks: 0,
        totalClicks: 0,
        clicksTrend: [],
        deviceBreakdown: [],
        referrerBreakdown: [],
        countryBreakdown: [],
      };
    }

    const clickWhere: any = {
      shortLinkId: { in: linkIds },
    };
    if (since) {
      clickWhere.clickedAt = { gte: since };
    }

    const clickEvents = await prisma.clickEvent.findMany({
      where: clickWhere,
      select: {
        clickedAt: true,
        deviceType: true,
        referrer: true,
        countryCode: true,
      },
      orderBy: { clickedAt: 'asc' },
    });

    const totalClicks = clickEvents.length;

    // Group clicks by date (YYYY-MM-DD)
    const clicksByDateMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    const countryMap = new Map<string, number>();

    for (const event of clickEvents) {
      const dateKey = event.clickedAt.toISOString().split('T')[0];
      clicksByDateMap.set(dateKey, (clicksByDateMap.get(dateKey) || 0) + 1);

      const device = event.deviceType || 'desktop';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

      const referrer = event.referrer || 'direct';
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);

      if (event.countryCode) {
        countryMap.set(event.countryCode, (countryMap.get(event.countryCode) || 0) + 1);
      }
    }

    // Convert map to sorted trend array
    const clicksTrend = Array.from(clicksByDateMap.entries()).map(([date, clicks]) => ({
      date,
      clicks,
    }));

    const deviceBreakdown = Array.from(deviceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const referrerBreakdown = Array.from(referrerMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const countryBreakdown = Array.from(countryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLinks,
      activeLinks,
      totalClicks,
      clicksTrend,
      deviceBreakdown,
      referrerBreakdown,
      countryBreakdown,
    };
  }

  /**
   * Retrieves analytics for a specific link with ownership check
   */
  static async getLinkAnalytics(userId: string, linkId: string, range: TimeRange = '30d') {
    const link = await prisma.shortLink.findFirst({
      where: { id: linkId, userId },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!link) {
      throw new AppError('Link not found or access denied', 404, 'NOT_FOUND');
    }

    const since = getDateThreshold(range);
    const clickWhere: any = { shortLinkId: link.id };
    if (since) {
      clickWhere.clickedAt = { gte: since };
    }

    const clickEvents = await prisma.clickEvent.findMany({
      where: clickWhere,
      select: {
        clickedAt: true,
        deviceType: true,
        referrer: true,
        countryCode: true,
      },
      orderBy: { clickedAt: 'asc' },
    });

    const totalClicks = clickEvents.length;

    const clicksByDateMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    const countryMap = new Map<string, number>();

    for (const event of clickEvents) {
      const dateKey = event.clickedAt.toISOString().split('T')[0];
      clicksByDateMap.set(dateKey, (clicksByDateMap.get(dateKey) || 0) + 1);

      const device = event.deviceType || 'desktop';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

      const referrer = event.referrer || 'direct';
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);

      if (event.countryCode) {
        countryMap.set(event.countryCode, (countryMap.get(event.countryCode) || 0) + 1);
      }
    }

    return {
      link,
      totalClicks,
      clicksTrend: Array.from(clicksByDateMap.entries()).map(([date, clicks]) => ({
        date,
        clicks,
      })),
      deviceBreakdown: Array.from(deviceMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      referrerBreakdown: Array.from(referrerMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      countryBreakdown: Array.from(countryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
}
