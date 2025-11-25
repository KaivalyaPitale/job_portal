import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { users } from './auth';

const router = Router();

// All subscription routes require auth
router.use(requireAuth);

// GET /api/subscription -> return current user with subscription status
router.get('/', (req, res) => {
  const authUser = (req as any).user as { sub: number };

  const user = users.find(u => u.id === authUser.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json(safeUser);
});

// POST /api/subscription/subscribe -> set isSubscribed = true
router.post('/subscribe', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'jobseeker') {
    return res.status(403).json({ message: 'Only job seekers can subscribe' });
  }

  const user = users.find(u => u.id === authUser.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isSubscribed = true;

  const { passwordHash, ...safeUser } = user;
  return res.json({
    message: 'Subscription activated',
    user: safeUser
  });
});

// POST /api/subscription/cancel -> set isSubscribed = false
router.post('/cancel', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'jobseeker') {
    return res.status(403).json({ message: 'Only job seekers can cancel subscription' });
  }

  const user = users.find(u => u.id === authUser.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isSubscribed = false;

  const { passwordHash, ...safeUser } = user;
  return res.json({
    message: 'Subscription cancelled',
    user: safeUser
  });
});

export default router;
