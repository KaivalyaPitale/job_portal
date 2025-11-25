export type ApplicationStatus = 'pending' | 'reviewed' | 'rejected' | 'accepted';

export interface Application {
  id: number;
  jobId: number;
  userId: number;
  createdAt: string;
  coverLetter?: string;
  status: ApplicationStatus;
}

export const applications: Application[] = [];
let nextApplicationId = 1;

export function createApplication(params: {
  jobId: number;
  userId: number;
  coverLetter?: string;
}): Application {
  const app: Application = {
    id: nextApplicationId++,
    jobId: params.jobId,
    userId: params.userId,
    coverLetter: params.coverLetter,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  applications.push(app);
  return app;
}
