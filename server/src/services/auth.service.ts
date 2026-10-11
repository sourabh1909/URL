import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/error';

interface ProviderProfile {
  provider: 'google' | 'github';
  providerAccountId: string;
  name?: string | null;
  email?: string | null;
  emailVerified: boolean;
  avatarUrl?: string | null;
}

export class AuthService {
  /**
   * Generates Google OAuth authorization URL with state and nonce
   */
  static getGoogleAuthUrl(): { url: string; state: string; nonce: string } {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google OAuth is not configured on the server', 503, 'SERVICE_UNAVAILABLE');
    }

    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state,
      nonce,
    };
  }

  /**
   * Generates GitHub OAuth authorization URL with state
   */
  static getGitHubAuthUrl(): { url: string; state: string } {
    if (!env.GITHUB_CLIENT_ID) {
      throw new AppError('GitHub OAuth is not configured on the server', 503, 'SERVICE_UNAVAILABLE');
    }

    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'read:user user:email',
      state,
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state,
    };
  }

  /**
   * Exchanges Google authorization code and retrieves user profile
   */
  static async handleGoogleCallback(code: string): Promise<ProviderProfile> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Google token exchange error:', err);
      throw new AppError('Failed to exchange code with Google', 400, 'OAUTH_ERROR');
    }

    const tokens = (await tokenResponse.json()) as { access_token: string; id_token?: string };

    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userinfoResponse.ok) {
      throw new AppError('Failed to fetch user profile from Google', 400, 'OAUTH_ERROR');
    }

    const profile = (await userinfoResponse.json()) as {
      sub: string;
      name?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };

    return {
      provider: 'google',
      providerAccountId: profile.sub,
      name: profile.name || null,
      email: profile.email ? profile.email.toLowerCase() : null,
      emailVerified: Boolean(profile.email_verified),
      avatarUrl: profile.picture || null,
    };
  }

  /**
   * Exchanges GitHub authorization code and retrieves user profile
   */
  static async handleGitHubCallback(code: string): Promise<ProviderProfile> {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    });

    if (!tokenResponse.ok) {
      throw new AppError('Failed to exchange code with GitHub', 400, 'OAUTH_ERROR');
    }

    const tokens = (await tokenResponse.json()) as { access_token?: string; error?: string };

    if (!tokens.access_token) {
      throw new AppError(tokens.error || 'Failed to authenticate with GitHub', 400, 'OAUTH_ERROR');
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'NordLink-App',
      },
    });

    if (!userResponse.ok) {
      throw new AppError('Failed to fetch user profile from GitHub', 400, 'OAUTH_ERROR');
    }

    const ghUser = (await userResponse.json()) as {
      id: number;
      name?: string;
      login: string;
      avatar_url?: string;
      email?: string;
    };

    let primaryEmail = ghUser.email ? ghUser.email.toLowerCase() : null;
    let isEmailVerified = false;

    // Fetch user emails if email is private
    try {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'NordLink-App',
        },
      });

      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;

        const primary = emails.find((e) => e.primary) || emails[0];
        if (primary) {
          primaryEmail = primary.email.toLowerCase();
          isEmailVerified = primary.verified;
        }
      }
    } catch {
      // Ignore emails fetch error and fall back to public profile
    }

    return {
      provider: 'github',
      providerAccountId: String(ghUser.id),
      name: ghUser.name || ghUser.login,
      email: primaryEmail,
      emailVerified: isEmailVerified,
      avatarUrl: ghUser.avatar_url || null,
    };
  }

  /**
   * Resolves or creates user while preventing unsafe automatic account merging (FR-AUTH-07)
   */
  static async resolveUserFromOAuth(
    profile: ProviderProfile,
    currentUserId?: string
  ) {
    // 1. Check if OAuth account already exists
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingOAuth) {
      // If user is already authenticated with another account and tries to link this one:
      if (currentUserId && existingOAuth.userId !== currentUserId) {
        throw new AppError(
          'This social account is already linked to another user.',
          409,
          'ACCOUNT_ALREADY_LINKED'
        );
      }
      return existingOAuth.user;
    }

    // 2. If user is currently authenticated, link to current account
    if (currentUserId) {
      const user = await prisma.user.findUnique({ where: { id: currentUserId } });
      if (!user) {
        throw new AppError('Current authenticated user not found', 404, 'USER_NOT_FOUND');
      }

      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      });

      return user;
    }

    // 3. User is not authenticated. Check if an account already exists with this email
    if (profile.email) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email: profile.email },
        include: { accounts: true },
      });

      if (existingUserWithEmail) {
        // Prevent unsafe automatic account merging (FR-AUTH-07)
        const linkedProviders = existingUserWithEmail.accounts.map((a: { provider: string }) => a.provider).join(', ');
        throw new AppError(
          `An account with email ${profile.email} already exists using ${linkedProviders || 'another sign-in method'}. Please sign in with that method to link accounts.`,
          409,
          'ACCOUNT_MERGE_RESTRICTED'
        );
      }
    }

    // 4. Create new user and OAuth account (transactionally if replica set is available, or sequentially with rollback for standalone local MongoDB)
    let newUser;
    try {
      newUser = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            emailVerified: profile.emailVerified,
            avatarUrl: profile.avatarUrl,
          },
        });

        await tx.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        });

        return user;
      });
    } catch (err: any) {
      if (err?.message?.includes('replica set') || err?.message?.includes('Transactions are not supported')) {
        // Fallback for standalone MongoDB (local dev without replica set)
        const user = await prisma.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            emailVerified: profile.emailVerified,
            avatarUrl: profile.avatarUrl,
          },
        });

        try {
          await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
            },
          });
        } catch (accountErr) {
          // Manual rollback if account link fails
          await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
          throw accountErr;
        }

        newUser = user;
      } else {
        throw err;
      }
    }

    return newUser;
  }

  /**
   * Deletes a user account and cascades all associated data (FR-SET-04)
   */
  static async deleteAccount(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
