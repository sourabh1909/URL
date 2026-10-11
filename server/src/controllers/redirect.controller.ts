import { Request, Response, NextFunction } from 'express';
import { RedirectService } from '../services/redirect.service';

export class RedirectController {
  static async handleRedirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { shortCode } = req.params;

      const result = await RedirectService.resolveAndRecord(shortCode, req);

      if (result.status === 'FOUND' && result.destinationUrl) {
        // Fast HTTP 302 redirect directly to verified destination
        return res.redirect(302, result.destinationUrl);
      }

      if (result.status === 'DISABLED') {
        res.status(410);
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link Disabled — ShortURL</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #F8FAFC;
                color: #263238;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .card {
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 16px;
                padding: 40px;
                max-width: 440px;
                text-align: center;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              }
              .badge {
                display: inline-block;
                background: #FEE2E2;
                color: #991B1B;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 16px;
              }
              h1 { font-size: 22px; margin: 0 0 10px; color: #244A42; }
              p { color: #64748B; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
              a {
                display: inline-block;
                background: #244A42;
                color: #FFFFFF;
                padding: 10px 20px;
                border-radius: 10px;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">Link Inactive</span>
              <h1>This link is currently disabled</h1>
              <p>The owner of this short link has paused or deactivated this redirect.</p>
              <a href="/">Go to ShortURL Home</a>
            </div>
          </body>
          </html>
        `);
      }

      // Link Not Found
      res.status(404);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Link Not Found — ShortURL</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #F8FAFC;
              color: #263238;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #FFFFFF;
              border: 1px solid #E2E8F0;
              border-radius: 16px;
              padding: 40px;
              max-width: 440px;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .badge {
              display: inline-block;
              background: #E2E8F0;
              color: #475569;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 13px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            h1 { font-size: 22px; margin: 0 0 10px; color: #244A42; }
            p { color: #64748B; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
            a {
              display: inline-block;
              background: #244A42;
              color: #FFFFFF;
              padding: 10px 20px;
              border-radius: 10px;
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">404</span>
            <h1>Link not found</h1>
            <p>The short link you are trying to visit does not exist or may have been deleted.</p>
            <a href="/">Go to ShortURL Home</a>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  }
}
