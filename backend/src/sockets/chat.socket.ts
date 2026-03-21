import { Server, Socket } from 'socket.io';
import { prisma } from '../index';
import { verifyAccessToken } from '../utils/jwt';
import redisClient from '../utils/redis';

export const initChatSockets = (io: Server) => {
    
    // Middleware for Socket Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = verifyAccessToken(token);
            socket.data.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId;
        console.log(`[Socket] User ${userId} connected (${socket.id})`);

        // Join a Webinar Room
        socket.on('join_room', async (data: { webinarId: string }) => {
            try {
                // Check if user is registered for this webinar
                const registration = await prisma.registration.findUnique({
                    where: { userId_webinarId: { userId, webinarId: data.webinarId } }
                });

                if (!registration) {
                    socket.emit('error', { message: 'Not registered for this webinar' });
                    return;
                }

                socket.join(`webinar_${data.webinarId}`);
                socket.emit('joined_room', { webinarId: data.webinarId });
            } catch (error) {
                console.error('Socket join_room error:', error);
            }
        });

        // Send a message
        socket.on('send_message', async (data: { webinarId: string, content: string }) => {
            try {
                const { webinarId, content } = data;
                
                // Anti-spam / Rate limiting (Max 5 messages per 10 seconds per user globally)
                const rateLimitKey = `rate_limit:chat:${userId}`;
                const msgCount = await redisClient.incr(rateLimitKey);
                
                if (msgCount === 1) {
                    await redisClient.expire(rateLimitKey, 10);
                }

                if (msgCount > 5) {
                    socket.emit('error', { message: 'Rate limit exceeded. Please wait a few seconds before sending more messages.' });
                    return;
                }

                // Check room attendance
                if (!socket.rooms.has(`webinar_${webinarId}`)) {
                    socket.emit('error', { message: 'You must join the room first' });
                    return;
                }

                // Sanitize content (basic length check)
                if (!content || content.trim().length === 0 || content.length > 500) {
                     socket.emit('error', { message: 'Message content invalid' });
                     return;
                }

                const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

                // Broadcast to room
                const messagePayload = {
                    userId,
                    name: user?.name,
                    content,
                    timestamp: new Date().toISOString()
                };

                io.to(`webinar_${webinarId}`).emit('new_message', messagePayload);

                // Async db storing
                prisma.chatMessage.create({
                    data: {
                        userId,
                        webinarId,
                        content
                    }
                }).catch(err => console.error('Failed to save chat message:', err));

            } catch (error) {
                console.error('Socket send_message error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} disconnected`);
        });
    });
};
