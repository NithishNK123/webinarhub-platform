import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        
        // Strictly verify HMAC signature using RAW body
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');

        if (expectedSignature !== signature) {
            logger.warn('Invalid webhook signature attempt from Razorpay', { ip: req.ip });
            res.status(400).send('Invalid signature');
            return;
        }

        // Parse body now that it's verified
        const payload = JSON.parse((req.body as Buffer).toString('utf8'));
        
        // Idempotency: skip if already processed
        // We use x-razorpay-event-id header
        const eventId = req.headers['x-razorpay-event-id'] as string;
        
        if (!eventId) {
            res.status(400).send('Event ID missing');
            return;
        }

        // Transactions locking and checking prevents race conditions on webhooks
        const existingEvent = await prisma.webhookEvent.findUnique({ where: { eventId } });
        if (existingEvent) {
            logger.info('Duplicate webhook skipped', { eventId });
            res.status(200).send('OK');
            return;
        }

        await prisma.webhookEvent.create({ data: { eventId, event: payload.event } });

        const event = payload.event;
        const paymentEntity = payload.payload.payment.entity;

        switch (event) {
            case 'payment.captured':
                // Payment was verified in-band earlier, but this is an out-of-band guarantee
                const orderId = paymentEntity.order_id;
                
                // Update payment to SUCCESS if not already
                const payment = await prisma.payment.findUnique({ where: { orderId } });
                
                if (payment && payment.status !== 'SUCCESS') {
                    await prisma.$transaction([
                        prisma.payment.update({
                            where: { orderId },
                            data: { status: 'SUCCESS', razorpayId: paymentEntity.id }
                        }),
                        prisma.registration.upsert({
                            where: { userId_webinarId: { userId: payment.userId, webinarId: payment.webinarId } },
                            update: {},
                            create: { userId: payment.userId, webinarId: payment.webinarId }
                        })
                    ]);
                    logger.info(`Webhook: Payment captured and user registered for order ${orderId}`);
                }
                break;
                
            case 'payment.failed':
                const failedOrderId = paymentEntity.order_id;
                await prisma.payment.updateMany({
                    where: { orderId: failedOrderId, status: 'PENDING' },
                    data: { status: 'FAILED' }
                });
                logger.warn(`Webhook: Payment failed for order ${failedOrderId}`);
                break;
                
            case 'refund.processed':
                // Handle refunds (cancel registration, log refund)
                logger.info(`Webhook: Refund processed for payment ${paymentEntity.id}`);
                // Implementation for refund... e.g delete registration
                break;

            default:
                logger.info(`Unhandled webhook event: ${event}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).send('Internal Server Error');
    }
};
