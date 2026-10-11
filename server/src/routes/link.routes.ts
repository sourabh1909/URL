import { Router } from 'express';
import { LinkController } from '../controllers/link.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { createLinkSchema, updateLinkSchema, queryLinksSchema, checkAliasSchema } from '../schemas/link.schema';
import { aliasCheckLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', requireAuth, validateBody(createLinkSchema), LinkController.createLink);
router.get('/', requireAuth, validateQuery(queryLinksSchema), LinkController.listLinks);
router.get('/check-alias/:alias', requireAuth, aliasCheckLimiter, validateParams(checkAliasSchema), LinkController.checkAlias);
router.get('/:id', requireAuth, LinkController.getLink);
router.patch('/:id', requireAuth, validateBody(updateLinkSchema), LinkController.updateLink);
router.delete('/:id', requireAuth, LinkController.deleteLink);

export default router;
