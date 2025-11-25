import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type UserRole = 'jobseeker' | 'employer';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  isSubscribed: boolean;
  // profile fields:
  fullName?: string;
  gender?: string;
  age?: number;
  currentPosition?: string;
  visibility?: 'public' | 'private';
  summary?: string;
}

// Temporary in-memory user store (will be replaced by a real DB later)
export const users: User[] = [];
let nextUserId = 1;

// 🔑 Use the SAME constant secret here and in authMiddleware
const JWT_SECRET = 'super-secret-change-me-123';
const BCRYPT_ROUNDS = 12;

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body as {
    email?: string;
    password?: string;
    role?: UserRole;
  };

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'email, password and role are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user: User = {
      id: nextUserId++,
      email,
      passwordHash,
      role,
      isSubscribed: false,
      visibility: 'public'
    };

    users.push(user);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed
    });
  } catch (err) {
    console.error('Error in register:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed
    }
  });
});

export default router;
