import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { applications, createApplication } from '../data/applicationsStore';

const router = Router();

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  teaser: string;
  employerId?: number; // employer who posted the job
}

// In-memory jobs store – starts EMPTY, employers will create jobs
export const jobs: Job[] = [];
let nextJobId = 1;

// Helper to create a job (used by employer routes)
export function createJob(params: {
  title: string;
  company: string;
  location: string;
  description: string;
  teaser: string;
  employerId: number;
}): Job {
  const job: Job = {
    id: nextJobId++,
    title: params.title,
    company: params.company,
    location: params.location,
    description: params.description,
    teaser: params.teaser,
    employerId: params.employerId
  };

  jobs.push(job);
  return job;
}

// GET /api/jobs  -> list of jobs (with basic filters)
router.get('/', (req, res) => {
  const { q, location, company } = req.query;

  let results = jobs;

  // text query: search in title, description, company, location
  if (typeof q === 'string' && q.trim() !== '') {
    const term = q.trim().toLowerCase();
    results = results.filter(j =>
      j.title.toLowerCase().includes(term) ||
      j.description.toLowerCase().includes(term) ||
      j.company.toLowerCase().includes(term) ||
      j.location.toLowerCase().includes(term)
    );
  }

  // filter by location (case-insensitive "contains")
  if (typeof location === 'string' && location.trim() !== '') {
    const loc = location.trim().toLowerCase();
    results = results.filter(j =>
      j.location.toLowerCase().includes(loc)
    );
  }

  // filter by company (case-insensitive "contains")
  if (typeof company === 'string' && company.trim() !== '') {
    const comp = company.trim().toLowerCase();
    results = results.filter(j =>
      j.company.toLowerCase().includes(comp)
    );
  }

  res.json(results);
});

// GET /api/jobs/:id  -> single job detail
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const job = jobs.find(j => j.id === id);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(job);
});

// POST /api/jobs/:id/apply -> job seeker applies for a job
router.post('/:id/apply', requireAuth, (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };
  const userId = authUser.sub;

  if (authUser.role !== 'jobseeker') {
    return res.status(403).json({ message: 'Only job seekers can apply for jobs' });
  }

  const jobId = Number(req.params.id);
  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  const { coverLetter } = req.body as { coverLetter?: string };

  const already = applications.find(
    a => a.jobId === jobId && a.userId === userId
  );
  if (already) {
    return res.status(409).json({ message: 'You have already applied for this job' });
  }

  const application = createApplication({
    jobId,
    userId,
    ...(coverLetter ? { coverLetter } : {})
  });

  return res.status(201).json({
    message: 'Application submitted',
    application
  });
});

export default router;
