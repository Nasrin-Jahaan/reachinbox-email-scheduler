import { Router } from 'express';
import { EmailController, scheduleEmailSchema } from '../controllers/email.controller';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.post('/schedule', validateBody(scheduleEmailSchema), EmailController.scheduleEmails);
router.get('/', EmailController.getEmails);
router.get('/search', SearchController.searchEmails);

export default router;
