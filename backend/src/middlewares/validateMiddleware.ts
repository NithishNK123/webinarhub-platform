import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validate = (schema: ZodType<any, any, any>) => 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error: any) {
            if (error instanceof ZodError || error?.name === 'ZodError') {
                res.status(400).json({
                    error: 'Validation failed',
                    issues: error.issues || error.errors || []
                });
            } else {
                next(error);
            }
        }
    };
