import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { jobs, createJob } from './jobs';
import { applications, type ApplicationStatus } from '../data/applicationsStore';
import { users } from './auth';

const router = Router();

// All employer routes require auth
router.use(requireAuth);

// GET /api/employer/jobs  -> list jobs for this employer
router.get('/jobs', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'employer') {
    res.status(403).json({ message: 'Only employers can view their jobs' });
    return;
  }

  const employerJobs = jobs.filter(j => j.employerId === authUser.sub);
  res.json(employerJobs);
});

// POST /api/employer/jobs -> create a new job post
router.post('/jobs', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'employer') {
    res.status(403).json({ message: 'Only employers can create job posts' });
    return;
  }

  const { title, company, location, description, teaser } = req.body as {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    teaser?: string;
  };

  if (!title || !company || !location || !description) {
    res.status(400).json({
      message: 'title, company, location, and description are required'
    });
    return;
  }

  const job = createJob({
    title,
    company,
    location,
    description,
    teaser: teaser || description.slice(0, 80) + '...',
    employerId: authUser.sub
  });

  res.status(201).json(job);
});

// DELETE /api/employer/jobs/:id -> delete a job post and its applications
router.delete('/jobs/:id', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'employer') {
    res.status(403).json({ message: 'Only employers can delete job posts' });
    return;
  }

  const jobId = Number(req.params.id);
  const idx = jobs.findIndex(j => j.id === jobId);

  if (idx === -1) {
    res.status(404).json({ message: 'Job not found' });
    return;
  }

  const job = jobs[idx];

  if (job.employerId !== authUser.sub) {
    res.status(403).json({ message: 'You do not own this job post' });
    return;
  }

  // Remove applications for this job
  for (let i = applications.length - 1; i >= 0; i--) {
    if (applications[i].jobId === jobId) {
      applications.splice(i, 1);
    }
  }

  // Remove the job itself
  jobs.splice(idx, 1);

  res.json({ message: 'Job deleted' });
});

// GET /api/employer/jobs/:id/applications -> view applications for a job
router.get('/jobs/:id/applications', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'employer') {
    res.status(403).json({ message: 'Only employers can view job applications' });
    return;
  }

  const jobId = Number(req.params.id);
  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    res.status(404).json({ message: 'Job not found' });
    return;
  }

  if (job.employerId !== authUser.sub) {
    res.status(403).json({ message: 'You do not own this job post' });
    return;
  }

  const jobApps = applications
    .filter(a => a.jobId === jobId)
    .map(a => {
      const user = users.find(u => u.id === a.userId);
      return {
        id: a.id,
        jobId: a.jobId,
        userId: a.userId,
        applicantEmail: user?.email,
        applicantName: user?.fullName,
        createdAt: a.createdAt,
        coverLetter: a.coverLetter,
        status: a.status
      };
    });

  res.json({
    job: {
      id: job.id,
      title: job.title,
      company: job.company
    },
    applications: jobApps
  });
});

// PATCH /api/employer/applications/:id -> update application status
router.patch('/applications/:id', (req, res) => {
  const authUser = (req as any).user as { sub: number; role: string };

  if (authUser.role !== 'employer') {
    res.status(403).json({ message: 'Only employers can update applications' });
    return;
  }

  const appId = Number(req.params.id);
  const { status } = req.body as { status?: ApplicationStatus };

  const allowedStatuses: ApplicationStatus[] = [
    'pending',
    'reviewed',
    'rejected',
    'accepted'
  ];

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400).json({
      message: "status must be one of 'pending', 'reviewed', 'rejected', 'accepted'"
    });
    return;
  }

  const app = applications.find(a => a.id === appId);
  if (!app) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  const job = jobs.find(j => j.id === app.jobId);
  if (!job) {
    res.status(404).json({ message: 'Job for this application not found' });
    return;
  }

  if (job.employerId !== authUser.sub) {
    res.status(403).json({ message: 'You do not own this job post' });
    return;
  }

  app.status = status;

  const user = users.find(u => u.id === app.userId);

  res.json({
    message: 'Application status updated',
    application: {
      id: app.id,
      jobId: app.jobId,
      userId: app.userId,
      applicantEmail: user?.email,
      applicantName: user?.fullName,
      createdAt: app.createdAt,
      coverLetter: app.coverLetter,
      status: app.status
    }
  });
});

export default router;
