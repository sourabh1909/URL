import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, TimeRange } from '../services/analytics.service';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const range = (req.query.range as TimeRange) || '30d';

      const overview = await AnalyticsService.getUserOverview(userId, range);
      res.json({ overview, range });
    } catch (error) {
      next(error);
    }
  }

  static async getLinkAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { linkId } = req.params;
      const range = (req.query.range as TimeRange) || '30d';

      const data = await AnalyticsService.getLinkAnalytics(userId, linkId, range);
      res.json({ ...data, range });
    } catch (error) {
      next(error);
    }
  }
}
