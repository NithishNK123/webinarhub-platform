import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';
import { razorpayInstance, verifyRazorpaySignature } from '../utils/razorpay';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { webinarId, idempotencyKey } = req.body;
        const userId = req.user!.userId;

        // Check if user is already registered
        const existingRegistration = await prisma.registration.findFirst({
            where: { userId, webinarId }
        });

        if (existingRegistration) {
             res.status(400).json({ error: 'Already registered for this webinar' });
             return;
        }

        // Check weaponized re-attempts / Idempotency
        const existingOrder = await prisma.payment.findFirst({
            where: { userId, webinarId, status: 'PENDING' }
        });

        if (existingOrder) {
            res.json({ orderId: existingOrder.orderId, amount: existingOrder.amount, currency: existingOrder.currency });
            return;
        }

        const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
        if (!webinar) {
             res.status(404).json({ error: 'Webinar not found' });
             return;
        }

        if (webinar.price <= 0) {
             res.status(400).json({ error: 'Webinar is free. Use standard registration.' });
             return;
        }

        // Amount must be trusted from DB only, converted to smallest currency unit (paise for INR)
        const amountInPaise = Math.round(webinar.price * 100);

        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${userId}_${webinarId}`,
        });

        // Store payment intent securely
        await prisma.payment.create({
            data: {
                razorpayId: '', // We don't have payment id yet
                orderId: order.id,
                amount: webinar.price,
                currency: 'INR',
                status: 'PENDING',
                userId,
                webinarId
            }
        });

        res.status(201).json({ orderId: order.id, amount: webinar.price, currency: 'INR' });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { webinarId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user!.userId;

        const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        
        if (!isValid) {
            console.warn(`[SECURITY] Invalid payment signature match for user ${userId}`);
            res.status(400).json({ error: 'Invalid payment signature' });
            return;
        }

        // Ensure order exists in our DB and status is pending
        const paymentRecord = await prisma.payment.findUnique({ where: { orderId: razorpay_order_id } });
        
        if (!paymentRecord || paymentRecord.userId !== userId || paymentRecord.webinarId !== webinarId) {
             res.status(400).json({ error: 'Invalid payment record' });
             return;
        }

        if (paymentRecord.status === 'SUCCESS') {
             res.status(400).json({ error: 'Payment already processed' });
             return;
        }

        // Update Payment to success and create registration within a transaction
        await prisma.$transaction([
            prisma.payment.update({
                where: { orderId: razorpay_order_id },
                data: { status: 'SUCCESS', razorpayId: razorpay_payment_id }
            }),
            prisma.registration.create({
                data: { userId, webinarId }
            })
        ]);

        res.json({ message: 'Payment verified and webinar registered successfully' });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
