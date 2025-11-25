import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../routes/auth';

export interface AuthPayload extends JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  isSubscribed: boolean;
}

// 🔑 Use the SAME constant as in routes/auth.ts
const JWT_SECRET = 'super-secret-change-me-123';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  console.log('=== requireAuth called ===');
  console.log('Authorization header received:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth error: missing or invalid Bearer prefix');
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring('Bearer '.length).trim();
  console.log('Token string length:', token.length);

  // Decode without verifying (for debugging)
  const decodedUnverified = jwt.decode(token);
  console.log('Decoded without verify:', decodedUnverified);

  console.log('JWT_SECRET used for verify:', JWT_SECRET);

  try {
    const decodedVerified = jwt.verify(token, JWT_SECRET);
    console.log('Decoded & VERIFIED payload:', decodedVerified);

    if (typeof decodedVerified !== 'object' || decodedVerified === null) {
      console.log('Token payload is not an object');
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const payload = decodedVerified as AuthPayload;

    (req as any).user = payload;
    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
