import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import redisClient from '../utils/redis';
import { logAudit } from '../utils/audit';

// Signup
export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, password } = req.body;
        
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] }
        });

        if (existingUser) {
             res.status(400).json({ error: 'User with email or phone already exists' });
             return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: { name, email, phone, passwordHash }
        });

        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.setex(`otp:${phone}`, 300, otp); // Expires in 5 mins
        
        // In real world, send OTP via SMS here
        console.log(`[DEV] OTP for ${phone}: ${otp}`);

        // Store refresh token securely in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'User created. Please verify OTP sent to phone.',
            user: { id: user.id, name: user.name, email: user.email },
            accessToken
        });

        await logAudit('USER_SIGNUP', {
            userId: user.id,
            ipAddress: req.ip || req.socket.remoteAddress,
            deviceId: req.headers['x-device-id'] as string
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify OTP
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, otp } = req.body;
        
        const storedOtp = await redisClient.get(`otp:${phone}`);
        if (!storedOtp || storedOtp !== otp) {
             res.status(400).json({ error: 'Invalid or expired OTP' });
             return;
        }

        await redisClient.del(`otp:${phone}`);
        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const deviceId = req.headers['x-device-id'] as string || 'unknown';

        const lockoutKey = `lockout:${email}`;
        const attemptsKey = `login_attempts:${email}`;

        if (await redisClient.get(lockoutKey)) {
             await logAudit('LOGIN_REJECTED_LOCKED', { ipAddress: ip, deviceId, details: { email } });
             res.status(403).json({ error: 'Account temporarily locked due to numerous failed attempts. Try again in 15 mins.' });
             return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
             await redisClient.incr(attemptsKey);
             await logAudit('LOGIN_FAILED_NOT_FOUND', { ipAddress: ip, deviceId, details: { email } });
             res.status(401).json({ error: 'Invalid credentials' });
             return;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
             const attempts = await redisClient.incr(attemptsKey);
             if (attempts === 1) await redisClient.expire(attemptsKey, 900); // 15 mins tracking
             
             if (attempts >= 5) {
                 await redisClient.setex(lockoutKey, 900, "locked"); // Lock for 15 mins
                 await logAudit('ACCOUNT_LOCKED', { userId: user.id, ipAddress: ip, deviceId });
             }

             await logAudit('LOGIN_FAILED_PASSWORD', { userId: user.id, ipAddress: ip, deviceId });
             res.status(401).json({ error: 'Invalid credentials' });
             return;
        }

        await redisClient.del(attemptsKey); // Reset attempts on succcess

        // Track IP and Device ID for Fraud Detection
        await prisma.user.update({
            where: { id: user.id },
            data: { lastIp: ip, deviceId }
        });

        const { accessToken, refreshToken } = generateTokens(user.id);
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email },
            accessToken
        });

        await logAudit('USER_LOGIN', { userId: user.id, ipAddress: ip, deviceId });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Refresh Token Rotation
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const cookies = req.headers.cookie;
        const refreshToken = cookies?.split('; ').find(row => row.startsWith('refreshToken='))?.split('=')[1];

        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token provided' });
            return;
        }

        // Token rotation logic: verify old token
        let decoded: any;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        const userId = decoded.userId;
        
        // Ensure token hasn't been blocked via Redis (Token Rotation blacklist)
        const isBlacklisted = await redisClient.get(`blacklist:token:${refreshToken}`);
        if (isBlacklisted) {
            await logAudit('TOKEN_REUSE_DETECTED', { userId, ipAddress: req.ip || req.socket.remoteAddress });
            // In a strict setup, we might revoke ALL sessions for this user here.
            res.status(403).json({ error: 'Token reuse detected. Please login again.' });
            return;
        }

        // Blacklist old token (Rotate)
        await redisClient.setex(`blacklist:token:${refreshToken}`, 7 * 24 * 60 * 60, "true");

        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
