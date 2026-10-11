import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('mongodb://localhost:27017/nordlink'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters').default('development-session-secret-change-in-production-1234'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/auth/callback/google'),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  GITHUB_CALLBACK_URL: z.string().url().default('http://localhost:4000/api/auth/callback/github'),
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  // In development, provide warning if only DATABASE_URL is missing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: Number(process.env.PORT) || 4000,
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
      DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/nordlink',
      SESSION_SECRET: process.env.SESSION_SECRET || 'development-session-secret-change-in-production-1234',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/callback/google',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
      GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/callback/github',
      COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    };
