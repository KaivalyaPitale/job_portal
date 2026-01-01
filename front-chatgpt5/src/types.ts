export type Role = "jobseeker" | "employer";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  isSubscribed: boolean;
}

export interface Profile extends AuthUser {
  fullName?: string;
  gender?: string;
  age?: number;
  currentPosition?: string;
  visibility?: "public" | "private";
  summary?: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  teaser: string;
  employerId?: number;
}

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface JobseekerApplication {
  id: number;
  jobId: number;
  createdAt: string;
  coverLetter?: string;
  status: ApplicationStatus;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
  } | null;
}

export interface EmployerJob extends Job {}

export interface EmployerJobApplication {
  id: number;
  jobId: number;
  userId: number;
  applicantEmail: string;
  applicantName?: string;
  createdAt: string;
  coverLetter?: string;
  status: ApplicationStatus;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
