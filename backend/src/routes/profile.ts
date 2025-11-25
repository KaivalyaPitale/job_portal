import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { users, User } from './auth';

const router = Router();

// GET /api/profile  -> return current user's profile
router.get('/', requireAuth, (req, res) => {
  const authUser = (req as any).user as { sub: number };

  const user = users.find(u => u.id === authUser.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json(safeUser);
});

// PUT /api/profile -> update current user's profile
router.put('/', requireAuth, (req, res) => {
  const authUser = (req as any).user as { sub: number };

  const user = users.find(u => u.id === authUser.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { fullName, gender, age, currentPosition, visibility, summary } = req.body as Partial<User>;

  if (visibility && visibility !== 'public' && visibility !== 'private') {
    return res.status(400).json({ message: "visibility must be 'public' or 'private'" });
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (gender !== undefined) user.gender = gender;
  if (age !== undefined) user.age = age;
  if (currentPosition !== undefined) user.currentPosition = currentPosition;
  if (visibility !== undefined) user.visibility = visibility;
  if (summary !== undefined) user.summary = summary;

  const { passwordHash, ...safeUser } = user;
  return res.json(safeUser);
});

export default router;
