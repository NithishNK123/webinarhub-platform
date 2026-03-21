import { prisma } from '../index';
import { logger } from './logger';

export const logAudit = async (
    action: string,
    data: {
        userId?: string;
        ipAddress?: string;
        deviceId?: string;
        details?: any;
    }
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                userId: data.userId,
                ipAddress: data.ipAddress,
                deviceId: data.deviceId,
                details: data.details
            }
        });
        logger.info(`[AUDIT] ${action}`, data);
    } catch (error) {
        logger.error('Failed to create audit log', { error, action, data });
    }
};
