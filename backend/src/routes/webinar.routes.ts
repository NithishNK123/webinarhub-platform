import { Router } from 'express';
import { createWebinar, listWebinars, registerForWebinar } from '../controllers/webinar.controller';
import { validate } from '../middlewares/validateMiddleware';
import { authenticate } from '../middlewares/authMiddleware';
import { createWebinarSchema, registerWebinarSchema } from '../validators/webinar.validator';

const router = Router();

// Public route to list webinars
router.get('/', listWebinars);

// Protected routes (Only authenticated users)
router.use(authenticate);
router.post('/', validate(createWebinarSchema), createWebinar);
router.post('/:id/register', validate(registerWebinarSchema), registerForWebinar);

export default router;
