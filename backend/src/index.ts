import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import webinarRoutes from './routes/webinar.routes';
import paymentRoutes from './routes/payment.routes';
import joinRoutes from './routes/join.routes';
import webhookRoutes from './routes/webhook.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import { initChatSockets } from './sockets/chat.socket';
import { logger } from './utils/logger';
import { requestLogger } from './middlewares/logging.middleware';
import { errorHandler } from './middlewares/error.middleware';
import redisClient from './utils/redis';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Strict Production Allowed Origins
const allowedOrigins = [
  process.env.ADMIN_PANEL_URL || 'http://localhost:5173',
  process.env.FRONTEND_WEB_URL || 'http://10.0.2.2:3000'
];

const io = new Server(httpServer, {
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy Warning: Origin rejected.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(requestLogger);

// Webhooks require raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Global JSON body parser for other routes
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Basic Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbOk = await prisma.$queryRaw`SELECT 1`;
    const redisOk = await redisClient.ping();
    res.status(200).json({ 
      status: 'ready', 
      dependencies: { postgres: !!dbOk, redis: redisOk === 'PONG' } 
    });
  } catch (error) {
    logger.error('READINESS_PROBE_FAILED', { error });
    res.status(503).json({ status: 'unready', error: 'Dependencies unavailable' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/join', joinRoutes);
app.use('/api/reviews', reviewRoutes);

// Admin Routes protected by RBAC
app.use('/api/v1/admin', adminRoutes);

// Socket.IO
initChatSockets(io);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, prisma, io };
