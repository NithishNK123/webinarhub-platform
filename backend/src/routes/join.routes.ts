import { Router } from 'express';
import { generateJoinToken, verifyJoinToken } from '../controllers/join.controller';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { generateTokenSchema, verifyTokenSchema } from '../validators/join.validator';

const router = Router();

// User requests a join token for a webinar they registered for
router.post('/:webinarId/generate', authenticate, validate(generateTokenSchema), generateJoinToken);

// Realtime server / WebRTC client verifies the token
router.post('/verify', validate(verifyTokenSchema), verifyJoinToken);

export default router;
