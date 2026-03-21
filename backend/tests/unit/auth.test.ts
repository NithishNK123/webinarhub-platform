import { Request, Response } from 'express';
import { signup } from '../../src/controllers/auth.controller';
import { prismaMock } from '../setup';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('bcrypt');

describe('Auth Controller - Signup', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            body: {
                name: 'John Doe',
                email: 'test@example.com',
                phone: '+1234567890',
                password: 'password123'
            },
            ip: '127.0.0.1',
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn()
        };
    });

    it('should successfully create a new user', async () => {
        // Setup mocks
        prismaMock.user.findFirst.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
        prismaMock.user.create.mockResolvedValue({
            id: 'uuid-123',
            name: mockReq.body.name,
            email: mockReq.body.email,
            phone: mockReq.body.phone,
            passwordHash: 'hashedPassword123',
            isBlocked: false,
            isVerifiedHost: false,
            lastIp: '127.0.0.1',
            deviceId: 'unknown',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await signup(mockReq as Request, mockRes as Response);

        expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
            where: {
                OR: [{ email: 'test@example.com' }, { phone: '+1234567890' }]
            }
        });
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(prismaMock.user.create).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.any(String),
            accessToken: expect.any(String)
        }));
    });

    it('should prevent signup if credentials already exist (Duplicate Registration edge case)', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'uuid-existing',
            name: 'Existing',
            email: 'test@example.com',
            phone: '+1234567890',
            passwordHash: 'hash',
            isBlocked: false,
            isVerifiedHost: false,
            lastIp: null,
            deviceId: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await signup(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'User with this email or phone already exists' });
    });
});
