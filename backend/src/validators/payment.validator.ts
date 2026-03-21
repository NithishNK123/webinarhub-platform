import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        webinarId: z.string().uuid("Invalid webinar ID"),
        idempotencyKey: z.string().min(1, "Idempotency key required")
    })
});

export const verifyPaymentSchema = z.object({
    body: z.object({
        webinarId: z.string().uuid("Invalid webinar ID"),
        razorpay_order_id: z.string().min(1, "Order ID required"),
        razorpay_payment_id: z.string().min(1, "Payment ID required"),
        razorpay_signature: z.string().min(1, "Signature required")
    })
});
