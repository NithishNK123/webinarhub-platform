import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { prisma } from '../index';
import { logAudit } from '../utils/audit';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.role !== 'admin') {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            await logAudit('UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', { userId, ipAddress: ip, details: { path: req.originalUrl } });
            
            res.status(403).json({ error: 'Access forbidden: Admin privileges required.' });
            return;
        }

        // Attach full user details to request if needed by admin controllers
        // req.user = { userId: user.id, role: user.role } -> already done by auth middleware but role might be absent from initial jwt decoding
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Internal server error while verifying privileges' });
    }
};
