import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type JobDetail = {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
};

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:4000/api/jobs/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load job');
        }
        return res.json();
      })
      .then((data: JobDetail) => {
        setJob(data);
      })
      .catch((err: any) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (!id) return <p>No job id provided.</p>;
  if (loading) return <p>Loading job details...</p>;
  if (!job) return <p>Job not found.</p>;

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      setApplyError('You must be logged in as a job seeker to apply.');
      return;
    }
    if (user.role !== 'jobseeker') {
      setApplyError('Only job seekers can apply for jobs.');
      return;
    }

    setApplyLoading(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const res = await fetch(`http://localhost:4000/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          coverLetter: coverLetter || undefined
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || 'Failed to apply for job';
        throw new Error(message);
      }

      setApplySuccess('Application submitted successfully.');
    } catch (err: any) {
      console.error(err);
      setApplyError(err.message || 'Failed to apply for job');
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div>
      <h1>{job.title}</h1>
      <p><strong>Company:</strong> {job.company}</p>
      <p><strong>Location:</strong> {job.location}</p>
      <p>{job.description}</p>

      <hr style={{ margin: '1rem 0' }} />

      {!user && <p>You must be logged in as a job seeker to apply.</p>}
      {user && user.role !== 'jobseeker' && (
        <p>Only job seekers can apply for jobs.</p>
      )}

      {user && user.role === 'jobseeker' && (
        <form
          onSubmit={handleApply}
          style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <label>
            Cover letter (optional)
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </label>

          {applyError && <p style={{ color: 'red' }}>{applyError}</p>}
          {applySuccess && <p style={{ color: 'green' }}>{applySuccess}</p>}

          <button type="submit" disabled={applyLoading}>
            {applyLoading ? 'Submitting…' : 'Apply for this job'}
          </button>
        </form>
      )}
    </div>
  );
}
