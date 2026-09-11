import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);
router.post('/dev-login', AuthController.devLogin);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', AuthController.logout);

export default router;
