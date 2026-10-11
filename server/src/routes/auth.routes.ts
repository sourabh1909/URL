import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/google', authLimiter, AuthController.googleAuth);
router.get('/github', authLimiter, AuthController.githubAuth);
router.get('/callback/google', AuthController.googleCallback);
router.get('/callback/github', AuthController.githubCallback);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/logout', requireAuth, AuthController.logout);
router.delete('/account', requireAuth, AuthController.deleteAccount);

export default router;
