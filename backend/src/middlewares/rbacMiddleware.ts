import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from './authMiddleware';

export const requireHost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const webinarId = req.params.id || req.body.webinarId;

        if (!webinarId) {
             res.status(400).json({ error: 'Webinar ID required for authorization' });
             return;
        }

        const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });

        if (!webinar) {
             res.status(404).json({ error: 'Webinar not found' });
             return;
        }

        if (webinar.hostId !== userId) {
             res.status(403).json({ error: 'Forbidden: Only the host can perform this action' });
             return;
        }

        next();
    } catch (error) {
        console.error('RBAC error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
