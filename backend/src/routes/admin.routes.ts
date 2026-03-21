import { Router } from 'express';
import { authenticate as requireAuth } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import { listUsers, banUser, unbanUser, listWebinars, deleteWebinar } from '../controllers/admin.controller';

const router = Router();

// Apply Auth and Admin RBAC globally to this router scope
router.use(requireAuth);
router.use(requireAdmin);

// User Management
router.get('/users', listUsers as any);
router.patch('/users/:id/ban', banUser as any);
router.patch('/users/:id/unban', unbanUser as any);

// Webinar Management
router.get('/webinars', listWebinars as any);
router.delete('/webinars/:id', deleteWebinar as any);

export default router;
