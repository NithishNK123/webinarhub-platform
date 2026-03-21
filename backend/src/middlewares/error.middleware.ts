import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('UNHANDLED_EXCEPTION', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.socket.remoteAddress
    });

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
    });
};
