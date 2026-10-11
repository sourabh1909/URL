import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🔗 ShortURL Server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
  console.log(`🔗 Configured Client URL: ${env.CLIENT_URL}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
