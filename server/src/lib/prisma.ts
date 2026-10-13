import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
