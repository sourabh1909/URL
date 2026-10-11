import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

// Base62 character set for clean, readable, URL-safe random codes
const ALPHANUMERIC_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateRandomCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
  }
  return result;
}

export class LinkService {
  /**
   * Generates a QR code data URL (image/png)
   */
  static async generateQrCode(shortCode: string): Promise<string> {
    const fullUrl = `${env.CLIENT_URL}/${shortCode}`;
    return QRCode.toDataURL(fullUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#244A42', // Nordic Pine
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Checks if an alias is already taken
   */
  static async isAliasTaken(shortCode: string): Promise<boolean> {
    const link = await prisma.shortLink.findUnique({
      where: { shortCode },
      select: { id: true },
    });
    return Boolean(link);
  }

  /**
   * Creates a new short link with unique code generation or custom alias
   */
  static async createLink(params: {
    userId: string;
    originalUrl: string;
    customAlias?: string;
  }) {
    const { userId, originalUrl, customAlias } = params;

    let shortCode = customAlias ? customAlias.trim() : '';

    if (shortCode) {
      // Check custom alias conflict
      const isTaken = await this.isAliasTaken(shortCode);
      if (isTaken) {
        throw new AppError(
          `The alias "${shortCode}" is already taken. Please choose another one.`,
          409,
          'ALIAS_CONFLICT'
        );
      }
    } else {
      // Generate unique random code with bounded retries
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        const candidate = generateRandomCode(6);
        const exists = await this.isAliasTaken(candidate);
        if (!exists) {
          shortCode = candidate;
          break;
        }
        attempts++;
      }

      if (!shortCode) {
        // Fall back to longer code if collision rate is high
        shortCode = generateRandomCode(8);
      }
    }

    const shortLink = await prisma.shortLink.create({
      data: {
        userId,
        shortCode,
        originalUrl,
        isActive: true,
      },
    });

    const qrCode = await this.generateQrCode(shortLink.shortCode);

    return {
      ...shortLink,
      shortUrl: `${env.CLIENT_URL}/${shortLink.shortCode}`,
      qrCode,
      clicksCount: 0,
    };
  }

  /**
   * Lists links owned by the user with search, pagination, and sorting
   */
  static async listUserLinks(params: {
    userId: string;
    search?: string;
    page: number;
    limit: number;
    sortBy: 'createdAt' | 'clicks' | 'shortCode';
    sortOrder: 'asc' | 'desc';
  }) {
    const { userId, search, page, limit, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { shortCode: { contains: q, mode: 'insensitive' } },
        { originalUrl: { contains: q, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.shortLink.count({ where });

    // Order by click count or database field
    let links;
    if (sortBy === 'clicks') {
      links = await prisma.shortLink.findMany({
        where,
        include: {
          _count: { select: { clickEvents: true } },
        },
        orderBy: {
          clickEvents: { _count: sortOrder },
        },
        skip,
        take: limit,
      });
    } else {
      links = await prisma.shortLink.findMany({
        where,
        include: {
          _count: { select: { clickEvents: true } },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      });
    }

    return {
      items: links.map((link: any) => ({
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        isActive: link.isActive,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        shortUrl: `${env.CLIENT_URL}/${link.shortCode}`,
        clicksCount: link._count.clickEvents,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single link by ID with ownership enforcement
   */
  static async getLinkById(userId: string, linkId: string) {
    const link = await prisma.shortLink.findFirst({
      where: { id: linkId, userId },
      include: {
        _count: { select: { clickEvents: true } },
      },
    });

    if (!link) {
      throw new AppError('Link not found or access denied', 404, 'NOT_FOUND');
    }

    const qrCode = await this.generateQrCode(link.shortCode);

    return {
      ...link,
      shortUrl: `${env.CLIENT_URL}/${link.shortCode}`,
      qrCode,
      clicksCount: link._count.clickEvents,
    };
  }

  /**
   * Updates destination URL or active state with ownership enforcement
   */
  static async updateLink(params: {
    userId: string;
    linkId: string;
    originalUrl?: string;
    isActive?: boolean;
  }) {
    const { userId, linkId, originalUrl, isActive } = params;

    const existing = await prisma.shortLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!existing) {
      throw new AppError('Link not found or access denied', 404, 'NOT_FOUND');
    }

    const updated = await prisma.shortLink.update({
      where: { id: linkId },
      data: {
        ...(originalUrl !== undefined ? { originalUrl } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        _count: { select: { clickEvents: true } },
      },
    });

    return {
      ...updated,
      shortUrl: `${env.CLIENT_URL}/${updated.shortCode}`,
      clicksCount: updated._count.clickEvents,
    };
  }

  /**
   * Deletes a link with ownership enforcement
   */
  static async deleteLink(userId: string, linkId: string) {
    const existing = await prisma.shortLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!existing) {
      throw new AppError('Link not found or access denied', 404, 'NOT_FOUND');
    }

    await prisma.shortLink.delete({
      where: { id: linkId },
    });

    return { success: true };
  }
}
