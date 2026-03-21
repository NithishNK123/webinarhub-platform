import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import crypto from 'crypto';

// Generate one-time join token
export const generateJoinToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const webinarId = String(req.params.webinarId);
        const userId = String(req.user!.userId);

        const registration = await prisma.registration.findUnique({
            where: { userId_webinarId: { userId, webinarId } }
        });

        if (!registration) {
             res.status(403).json({ error: 'You are not registered for this webinar' });
             return;
        }

        const joinToken = crypto.randomBytes(32).toString('hex');

        await prisma.registration.update({
            where: { id: registration.id },
            data: { joinToken }
        });

        res.json({ joinToken });
    } catch (error) {
        console.error('Generate token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify one-time token
export const verifyJoinToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;

        const registration = await prisma.registration.findUnique({
            where: { joinToken: token },
            include: { user: { select: { id: true, name: true } }, webinar: { select: { id: true, title: true } } }
        });

        if (!registration) {
             res.status(401).json({ error: 'Invalid or expired token' });
             return;
        }

        // Invalidate token immediately after verification (burn after reading)
        await prisma.registration.update({
            where: { id: registration.id },
            data: { joinToken: null }
        });

        res.json({ message: 'Token verified successfully', participant: registration.user, webinarId: registration.webinar.id });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
