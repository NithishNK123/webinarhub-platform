import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationInMillis = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        
        // Log all requests
        logger.info('HTTP_REQUEST', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationInMillis),
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent') || 'unknown',
            deviceId: req.get('x-device-id') || 'unknown'
        });
    });

    next();
};
