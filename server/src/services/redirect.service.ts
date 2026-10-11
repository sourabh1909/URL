import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error';

export interface RedirectResult {
  status: 'FOUND' | 'DISABLED' | 'NOT_FOUND';
  destinationUrl?: string;
}

export class RedirectService {
  /**
   * Resolves a short code, records click event asynchronously, and returns redirection details
   */
  static async resolveAndRecord(shortCode: string, req: Request): Promise<RedirectResult> {
    const link = await prisma.shortLink.findUnique({
      where: { shortCode },
      select: {
        id: true,
        originalUrl: true,
        isActive: true,
      },
    });

    if (!link) {
      return { status: 'NOT_FOUND' };
    }

    if (!link.isActive) {
      return { status: 'DISABLED' };
    }

    // Record click event non-blockingly without delaying response
    this.recordClick(link.id, req).catch((err) => {
      console.error(`Failed to record click for link ${link.id}:`, err);
    });

    return {
      status: 'FOUND',
      destinationUrl: link.originalUrl,
    };
  }

  /**
   * Privacy-conscious click recording: extracts coarse device category and referrer
   */
  private static async recordClick(shortLinkId: string, req: Request) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const os = parser.getOS();

      // Device category: 'mobile', 'tablet', 'desktop', or 'bot'
      let deviceType: string = (device.type as string) || 'desktop';
      if (/bot|crawler|spider|crawling/i.test(userAgent)) {
        deviceType = 'bot';
      }

      // Referrer domain only (privacy preservation)
      const rawReferrer = req.headers['referer'] || req.headers['referrer'];
      let referrerDomain: string | null = null;
      if (typeof rawReferrer === 'string') {
        try {
          const parsed = new URL(rawReferrer);
          referrerDomain = parsed.hostname;
        } catch {
          referrerDomain = 'direct';
        }
      } else {
        referrerDomain = 'direct';
      }

      // Coarse country code from CDN/proxy headers if provided (e.g. Cloudflare)
      const countryHeader = req.headers['cf-ipcountry'] || req.headers['x-country-code'];
      const countryCode = typeof countryHeader === 'string' && countryHeader.length === 2
        ? countryHeader.toUpperCase()
        : null;

      await prisma.clickEvent.create({
        data: {
          shortLinkId,
          referrer: referrerDomain,
          deviceType,
          countryCode,
        },
      });
    } catch (e) {
      // Never throw from async click recording
    }
  }
}
