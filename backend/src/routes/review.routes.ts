import { Router } from 'express';
import { addReview } from '../controllers/review.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { z } from 'zod';
import { validate } from '../middlewares/validateMiddleware';

const router = Router();

const reviewSchema = z.object({
    body: z.object({
        webinarId: z.string().uuid("Invalid webinar ID"),
        rating: z.number().min(1).max(5),
        comment: z.string().optional()
    })
});

router.post('/', authenticate, validate(reviewSchema), addReview);

export default router;
