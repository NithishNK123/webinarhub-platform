import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../index';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, isBlocked: true }
        });
        res.status(200).json(users);
    } catch (error) {
        logger.error('ADMIN_LIST_USERS_ERROR', { error });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const banUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (targetUser.role === 'admin') {
            res.status(403).json({ error: 'Cannot ban another administrator' });
            return;
        }

        await prisma.user.update({ where: { id }, data: { isBlocked: true } });
        await logAudit('ADMIN_USER_BANNED', { 
            userId: String(req.user!.userId), 
            details: { targetUserId: id, targetEmail: targetUser.email } 
        });

        res.status(200).json({ message: `User ${targetUser.email} has been globally banned.` });
    } catch (error) {
        logger.error('ADMIN_BAN_USER_ERROR', { error });
        res.status(500).json({ error: 'Failed to ban user' });
    }
};

export const unbanUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await prisma.user.update({ where: { id }, data: { isBlocked: false } });
        await logAudit('ADMIN_USER_UNBANNED', { 
            userId: String(req.user!.userId), 
            details: { targetUserId: id, targetEmail: targetUser.email } 
        });

        res.status(200).json({ message: `User ${targetUser.email} has been unbanned.` });
    } catch (error) {
        logger.error('ADMIN_UNBAN_USER_ERROR', { error });
        res.status(500).json({ error: 'Failed to unban user' });
    }
};

export const listWebinars = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const webinars = await prisma.webinar.findMany({
            select: {
                id: true, title: true, domain: true, 
                host: { select: { id: true, name: true, email: true } }
            }
        });
        res.status(200).json(webinars);
    } catch (error) {
        logger.error('ADMIN_LIST_WEBINARS_ERROR', { error });
        res.status(500).json({ error: 'Failed to fetch webinars' });
    }
};

export const deleteWebinar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const targetWebinar = await prisma.webinar.findUnique({ where: { id } });
        
        if (!targetWebinar) {
            res.status(404).json({ error: 'Webinar not found' });
            return;
        }

        await prisma.webinar.delete({ where: { id } });
        await logAudit('ADMIN_WEBINAR_DELETED', { 
            userId: String(req.user!.userId), 
            details: { webinarId: id, title: targetWebinar.title, hostId: targetWebinar.hostId } 
        });

        res.status(200).json({ message: `Webinar '${targetWebinar.title}' successfully deleted.` });
    } catch (error) {
        logger.error('ADMIN_DELETE_WEBINAR_ERROR', { error });
        res.status(500).json({ error: 'Failed to delete webinar' });
    }
};
