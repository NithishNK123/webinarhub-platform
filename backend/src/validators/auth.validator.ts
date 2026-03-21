import { z } from 'zod';

export const signupSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        phone: z.string().min(10, "Phone must be at least 10 characters"),
        password: z.string().min(6, "Password must be at least 6 characters")
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string()
    })
});

export const verifyOtpSchema = z.object({
    body: z.object({
        phone: z.string(),
        otp: z.string().length(6, "OTP must be 6 digits")
    })
});
