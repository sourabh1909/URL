import { z } from 'zod';

const RESERVED_ALIASES = new Set([
  'api',
  'login',
  'logout',
  'dashboard',
  'analytics',
  'settings',
  'health',
  'static',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

export function isValidHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .min(1, 'Destination URL is required')
    .refine(isValidHttpUrl, {
      message: 'Destination URL must be a valid HTTP or HTTPS address',
    }),
  customAlias: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom alias can only contain letters, numbers, hyphens, and underscores')
    .min(3, 'Custom alias must be at least 3 characters')
    .max(32, 'Custom alias cannot exceed 32 characters')
    .refine((alias) => !RESERVED_ALIASES.has(alias.toLowerCase()), {
      message: 'This alias is reserved and cannot be used',
    })
    .optional()
    .or(z.literal('')),
});

export const updateLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .refine(isValidHttpUrl, {
      message: 'Destination URL must be a valid HTTP or HTTPS address',
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const queryLinksSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'clicks', 'shortCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const checkAliasSchema = z.object({
  alias: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alias can only contain letters, numbers, hyphens, and underscores')
    .min(3, 'Alias must be at least 3 characters')
    .max(32, 'Alias cannot exceed 32 characters')
    .refine((alias) => !RESERVED_ALIASES.has(alias.toLowerCase()), {
      message: 'This alias is reserved and cannot be used',
    }),
});
