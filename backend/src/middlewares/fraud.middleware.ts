import { Request, Response, NextFunction } from 'express';
import redisClient from '../utils/redis';
import { logger } from '../utils/logger';
import { prisma } from '../index';

export const detectFraud = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const deviceId = req.headers['x-device-id'] as string || 'unknown';
        const email = req.body.email; // For auth routes
        
        // 1. Block globally blacklisted IPs
        const isIpBlocked = await redisClient.get(`blacklist:ip:${ip}`);
        if (isIpBlocked) {
            logger.warn('FRAUD_ALERT: Blocked IP attempted access', { ip, deviceId });
            res.status(403).json({ error: 'Access denied due to suspicious activity' });
            return;
        }

        // 2. Track accounts per device/IP (Signups limit to 3 per IP/Device per day)
        if (req.path === '/signup') {
            const signupKey = `fraud:signup:${ip}:${deviceId}`;
            const attempts = await redisClient.incr(signupKey);
            
            if (attempts === 1) {
                await redisClient.expire(signupKey, 86400); // 24 hours
            }

            if (attempts > 3) {
                logger.warn('FRAUD_ALERT: Too many accounts created from same device/IP', { ip, deviceId, email });
                res.status(403).json({ error: 'Too many accounts registered from this device' });
                return;
            }
        }

        // 3. User block check
        // If it's a login, check if the email belongs to a blocked user
        if (req.path === '/login' && email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user?.isBlocked) {
                logger.warn('FRAUD_ALERT: Blocked user attempted login', { userId: user.id, email, ip });
                res.status(403).json({ error: 'Your account has been suspended for violating terms.' });
                return;
            }
        }

        next();
    } catch (error) {
        logger.error('Fraud detection middleware error', error);
        next();
    }
};

// Payment fraud rate limter explicitly checking payment attempts
export const paymentFraudCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const paymentKey = `fraud:payment_attempts:${ip}`;
        
        const attempts = await redisClient.incr(paymentKey);
        if (attempts === 1) {
            await redisClient.expire(paymentKey, 3600); // 1 hour
        }

        if (attempts > 20) {
            // Block IP completely for 24 hours
            await redisClient.setex(`blacklist:ip:${ip}`, 86400, 'blocked');
            logger.warn('FRAUD_ALERT: IP blocked due to payment spam/card testing', { ip });
            res.status(403).json({ error: 'Suspicious payment activity detected. Try again later.' });
            return;
        }

        next();
    } catch (error) {
        logger.error('Payment fraud check error', error);
        next();
    }
};
