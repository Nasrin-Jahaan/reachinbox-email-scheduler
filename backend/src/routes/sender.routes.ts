import { Router } from 'express';
import { SenderController, createSenderSchema } from '../controllers/sender.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/', SenderController.getSenders);
router.post('/', validateBody(createSenderSchema), SenderController.createSender);

export default router;
