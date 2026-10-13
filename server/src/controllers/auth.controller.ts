import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';
import { AppError } from '../middleware/error';
import { prisma } from '../lib/prisma';

export class AuthController {
  static async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, state, nonce } = AuthService.getGoogleAuthUrl();
      req.session.oauthState = state;
      req.session.oauthNonce = nonce;
      req.session.oauthProvider = 'google';
      req.session.save((err) => {
        if (err) {
          console.warn('⚠️ Session save warning in googleAuth:', err?.message || err);
        }
        res.redirect(url);
      });
    } catch (error) {
      next(error);
    }
  }

  static async githubAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, state } = AuthService.getGitHubAuthUrl();
      req.session.oauthState = state;
      req.session.oauthProvider = 'github';
      req.session.save((err) => {
        if (err) {
          console.warn('⚠️ Session save warning in githubAuth:', err?.message || err);
        }
        res.redirect(url);
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(String(oauthError))}`);
      }

      if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code is missing', 400, 'INVALID_CALLBACK');
      }

      if (!state || state !== req.session.oauthState) {
        throw new AppError('Invalid OAuth state parameter', 400, 'CSRF_DETECTED');
      }

      const profile = await AuthService.handleGoogleCallback(code);
      const user = await AuthService.resolveUserFromOAuth(profile, req.session.userId);

      // Regenerate session to protect against session fixation attacks
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        req.session.save(() => {
          res.redirect(`${env.CLIENT_URL}/dashboard`);
        });
      });
    } catch (error: any) {
      const message = error?.message || 'Authentication failed';
      res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(message)}`);
    }
  }

  static async githubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(String(oauthError))}`);
      }

      if (!code || typeof code !== 'string') {
        throw new AppError('Authorization code is missing', 400, 'INVALID_CALLBACK');
      }

      if (!state || state !== req.session.oauthState) {
        throw new AppError('Invalid OAuth state parameter', 400, 'CSRF_DETECTED');
      }

      const profile = await AuthService.handleGitHubCallback(code);
      const user = await AuthService.resolveUserFromOAuth(profile, req.session.userId);

      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = user.id;
        req.session.save(() => {
          res.redirect(`${env.CLIENT_URL}/dashboard`);
        });
      });
    } catch (error: any) {
      const message = error?.message || 'Authentication failed';
      res.redirect(`${env.CLIENT_URL}/login?error=${encodeURIComponent(message)}`);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const accounts = await prisma.oAuthAccount.findMany({
        where: { userId: req.user.id },
        select: { provider: true, createdAt: true },
      });

      res.json({
        user: {
          ...req.user,
          providers: accounts.map((a: { provider: string }) => a.provider),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    req.session.destroy((err) => {
      if (err) {
        return next(new AppError('Failed to logout cleanly', 500, 'LOGOUT_FAILED'));
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      await AuthService.deleteAccount(req.user.id);

      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ message: 'Account and associated data deleted permanently' });
      });
    } catch (error) {
      next(error);
    }
  }
}
