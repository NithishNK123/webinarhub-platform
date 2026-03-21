import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';
import { paymentFraudCheck } from '../middlewares/fraud.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

router.use(authenticate);

// Rate limiter for creating orders to prevent card-testing attacks and spam
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many order attempts' }
});

router.post('/orders', paymentFraudCheck, orderLimiter, validate(createOrderSchema), createOrder);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);

export default router;
