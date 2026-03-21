import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { webinarId, rating, comment } = req.body;
        const userId = req.user!.userId;

        // Ratings must be between 1 and 5
        if (rating < 1 || rating > 5) {
             res.status(400).json({ error: 'Rating must be between 1 and 5' });
             return;
        }

        // Must be registered to review
        const registration = await prisma.registration.findUnique({
            where: { userId_webinarId: { userId, webinarId } }
        });

        if (!registration) {
             res.status(403).json({ error: 'Only attendees can leave a review.' });
             return;
        }

        // Upsert the review to allow changing mind
        const review = await prisma.review.upsert({
            where: { userId_webinarId: { userId, webinarId } },
            update: { rating, comment },
            create: { userId, webinarId, rating, comment }
        });

        // Recalculate average rating directly in SQL/Prisma
        const _avg = await prisma.review.aggregate({
            where: { webinarId },
            _avg: { rating: true },
            _count: { rating: true }
        });

        await prisma.webinar.update({
            where: { id: webinarId },
            data: { 
                averageRating: _avg._avg.rating || 0,
                ratingCount: _avg._count.rating || 0
            }
        });

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
