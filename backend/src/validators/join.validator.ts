import { z } from 'zod';

export const generateTokenSchema = z.object({
    params: z.object({
        webinarId: z.string().uuid("Invalid webinar ID")
    })
});

export const verifyTokenSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token required")
    })
});
