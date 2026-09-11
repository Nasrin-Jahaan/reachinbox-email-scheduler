import { Router } from 'express';
import { SlackController } from '../controllers/slack.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/connect', SlackController.connect);
router.get('/callback', SlackController.callback);
router.post('/disconnect', authenticate, SlackController.disconnect);

export default router;
