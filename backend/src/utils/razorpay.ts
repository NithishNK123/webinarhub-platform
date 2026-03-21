import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || 'dummy_key_id';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

export const razorpayInstance = new Razorpay({
    key_id,
    key_secret
});

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string): boolean => {
    const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    
    return generatedSignature === signature;
};
