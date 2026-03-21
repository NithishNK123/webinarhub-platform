import { Router } from 'express';
import { signup, login, verifyOtp } from '../controllers/auth.controller';
import { validate } from '../middlewares/validateMiddleware';
import { signupSchema, loginSchema, verifyOtpSchema } from '../validators/auth.validator';
import rateLimit from 'express-rate-limit';
import { detectFraud } from '../middlewares/fraud.middleware';

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for login
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

router.post('/signup', detectFraud, validate(signupSchema), signup);
router.post('/login', detectFraud, loginLimiter, validate(loginSchema), login);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/refresh', detectFraud, require('./../controllers/auth.controller').refresh);

export default router;
