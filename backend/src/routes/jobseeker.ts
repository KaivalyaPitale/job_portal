import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { applications } from '../data/applicationsStore';
import { jobs } from './jobs';

const router = Router();

// require auth for all routes
router.use(requireAuth);

// GET /api/jobseeker/applications -> list applications of current job seeker
router.get('/applications', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'jobseeker') {
    return res.status(403).json({ message: 'Only job seekers can view their applications' });
  }

  const userId = authUser.sub;

  const userApps = applications
    .filter(a => a.userId === userId)
    .map(a => {
      const job = jobs.find(j => j.id === a.jobId);
      return {
        id: a.id,
        jobId: a.jobId,
        createdAt: a.createdAt,
        coverLetter: a.coverLetter,
        status: a.status,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location
            }
          : null
      };
    });

  return res.json({ applications: userApps });
});

export default router;
