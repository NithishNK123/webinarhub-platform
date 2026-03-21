import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller';

const router = Router();

// Express raw body is handled globally for this route in index.ts
router.post('/razorpay', handleRazorpayWebhook);

export default router;
