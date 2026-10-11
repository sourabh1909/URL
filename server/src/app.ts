import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import linkRoutes from './routes/link.routes';
import analyticsRoutes from './routes/analytics.routes';
import { RedirectController } from './controllers/redirect.controller';
import { errorHandler } from './middleware/error';
import { generalLimiter } from './middleware/rateLimiter';

export function createApp() {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Basic security and parsing
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow inline QR code data URLs and styling
    })
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalLimiter);

  // Setup session store
  let sessionStore: session.Store;
  if (env.NODE_ENV === 'test') {
    sessionStore = new session.MemoryStore();
  } else {
    try {
      sessionStore = MongoStore.create({
        mongoUrl: env.DATABASE_URL,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
      });
    } catch {
      console.warn('⚠️ Falling back to MemoryStore for sessions.');
      sessionStore = new session.MemoryStore();
    }
  }

  app.use(
    session({
      store: sessionStore,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      proxy: env.NODE_ENV === 'production',
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: env.COOKIE_DOMAIN || undefined,
      },
    })
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/links', linkRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Public Redirect Route: GET /:shortCode
  // Reserved words are excluded in link schema
  app.get('/:shortCode', RedirectController.handleRedirect);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
