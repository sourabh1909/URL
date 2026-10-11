import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    oauthState?: string;
    oauthNonce?: string;
    oauthProvider?: 'google' | 'github';
  }
}

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
