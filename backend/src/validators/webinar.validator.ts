import { z } from 'zod';

const SPAM_WORDS = ['crypto', 'bitcoin', 'ponzi', 'get rich quick', 'casino', 'betting'];

export const createWebinarSchema = z.object({
    body: z.object({
        title: z.string().min(10).max(100).refine(val => !SPAM_WORDS.some(word => val.toLowerCase().includes(word)), {
            message: "Title contains prohibited promotional keywords."
        }),
        description: z.string().min(50).max(2000),
        price: z.number().min(0).max(10000),
        domain: z.string().min(3).max(50).optional(),
        startTime: z.string().datetime().refine(val => new Date(val) > new Date(), {
            message: "Start time must be in the future"
        }).refine(val => new Date(val) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), {
            message: "Cannot schedule more than 6 months in advance"
        }),
        endTime: z.string().datetime()
    }).refine(data => new Date(data.startTime) < new Date(data.endTime), {
        message: "End time must be after start time",
        path: ["endTime"]
    })
});

export const registerWebinarSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid webinar ID format")
    })
});
