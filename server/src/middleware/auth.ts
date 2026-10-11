import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access this resource',
      },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session invalid or user not found',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
