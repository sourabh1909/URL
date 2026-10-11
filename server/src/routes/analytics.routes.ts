import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { analyticsQuerySchema } from '../schemas/analytics.schema';

const router = Router();

router.get('/overview', requireAuth, validateQuery(analyticsQuerySchema), AnalyticsController.getOverview);
router.get('/:linkId', requireAuth, validateQuery(analyticsQuerySchema), AnalyticsController.getLinkAnalytics);

export default router;
