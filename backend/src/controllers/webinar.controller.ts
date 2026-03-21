import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create Webinar
export const createWebinar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, price, domain, startTime, endTime } = req.body;
        const hostId = String(req.user!.userId);

        const host = await prisma.user.findUnique({ where: { id: hostId } });
        if (price > 0 && !host?.isVerifiedHost) {
             res.status(403).json({ error: 'Unverified hosts cannot create paid webinars. Please complete KYC.' });
             return;
        }

        // Limit active/upcoming webinars to prevent spam
        const upcomingCount = await prisma.webinar.count({
            where: {
                hostId,
                startTime: { gt: new Date() }
            }
        });

        if (upcomingCount >= 5 && !host?.isVerifiedHost) {
             const limit = host?.isVerifiedHost ? 50 : 5;
             if (upcomingCount >= limit) {
                 res.status(429).json({ error: `You have reached the limit of ${limit} upcoming webinars.` });
                 return;
             }
        }

        const webinar = await prisma.webinar.create({
            data: { title, description, price, domain, startTime, endTime, hostId }
        });

        res.status(201).json({ message: 'Webinar created', webinar });
    } catch (error) {
        console.error('Error creating webinar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List Webinars with Filters
export const listWebinars = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isFree, domain } = req.query;
        
        const filter: any = {};
        if (isFree === 'true') filter.price = 0;
        if (isFree === 'false') filter.price = { gt: 0 };
        if (domain) filter.domain = String(domain);

        const webinars = await prisma.webinar.findMany({
            where: filter,
            include: { host: { select: { id: true, name: true, email: true } } },
            orderBy: { startTime: 'asc' }
        });

        res.json({ webinars });
    } catch (error) {
        console.error('Error listing webinars:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Register for Webinar (Free only for now - Paid handled in Step 5 Payment)
export const registerForWebinar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const webinarId = String(req.params.id);
        const userId = String(req.user!.userId);

        const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
        if (!webinar) {
             res.status(404).json({ error: 'Webinar not found' });
             return;
        }

        const existingRegistration = await prisma.registration.findUnique({
            where: { userId_webinarId: { userId, webinarId } }
        });

        if (existingRegistration) {
             res.status(400).json({ error: 'Already registered for this webinar' });
             return;
        }

        if (webinar.price > 0) {
             res.status(400).json({ error: 'This is a paid webinar. Please initiate payment.' });
             return;
        }

        const registration = await prisma.registration.create({
            data: { userId, webinarId }
        });

        res.status(201).json({ message: 'Registered successfully', registration });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
