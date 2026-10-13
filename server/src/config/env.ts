import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Helper: sanitize DATABASE_URL (fix accidental single slash typos e.g. mongodb+srv:/ -> mongodb+srv://)
function sanitizeDbUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('mongodb+srv:/') && !trimmed.startsWith('mongodb+srv://')) {
    trimmed = trimmed.replace('mongodb+srv:/', 'mongodb+srv://');
  }
  if (trimmed.startsWith('mongodb:/') && !trimmed.startsWith('mongodb://')) {
    trimmed = trimmed.replace('mongodb:/', 'mongodb://');
  }
  return trimmed;
}

// Helper: sanitize URLs by trimming and stripping trailing slashes
function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed || undefined;
}

function emptyToUndefined(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  return trimmed || undefined;
}

const rawEnv = {
  NODE_ENV: emptyToUndefined(process.env.NODE_ENV),
  PORT: emptyToUndefined(process.env.PORT),
  CLIENT_URL: sanitizeUrl(process.env.CLIENT_URL),
  DATABASE_URL: sanitizeDbUrl(process.env.DATABASE_URL),
  SESSION_SECRET: emptyToUndefined(process.env.SESSION_SECRET),
  GOOGLE_CLIENT_ID: emptyToUndefined(process.env.GOOGLE_CLIENT_ID) || '',
  GOOGLE_CLIENT_SECRET: emptyToUndefined(process.env.GOOGLE_CLIENT_SECRET) || '',
  GOOGLE_CALLBACK_URL: sanitizeUrl(process.env.GOOGLE_CALLBACK_URL),
  GITHUB_CLIENT_ID: emptyToUndefined(process.env.GITHUB_CLIENT_ID) || '',
  GITHUB_CLIENT_SECRET: emptyToUndefined(process.env.GITHUB_CLIENT_SECRET) || '',
  GITHUB_CALLBACK_URL: sanitizeUrl(process.env.GITHUB_CALLBACK_URL),
  COOKIE_DOMAIN: emptyToUndefined(process.env.COOKIE_DOMAIN),
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('mongodb://localhost:27017/nordlink'),
  SESSION_SECRET: z.string().min(16).default('development-session-secret-change-in-production-1234'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/auth/callback/google'),
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/auth/callback/github'),
  COOKIE_DOMAIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables detected:', JSON.stringify(parsed.error.format(), null, 2));
}

export const env: Env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: (rawEnv.NODE_ENV as any) || 'development',
      PORT: Number(rawEnv.PORT) || 4000,
      CLIENT_URL: rawEnv.CLIENT_URL || 'http://localhost:5173',
      DATABASE_URL: rawEnv.DATABASE_URL || 'mongodb://localhost:27017/nordlink',
      SESSION_SECRET: rawEnv.SESSION_SECRET || 'development-session-secret-change-in-production-1234',
      GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: rawEnv.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: rawEnv.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/callback/google',
      GITHUB_CLIENT_ID: rawEnv.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: rawEnv.GITHUB_CLIENT_SECRET,
      GITHUB_CALLBACK_URL: rawEnv.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/callback/github',
      COOKIE_DOMAIN: rawEnv.COOKIE_DOMAIN,
    };
