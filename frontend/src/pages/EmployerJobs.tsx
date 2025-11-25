import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type EmployerJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  teaser: string;
};

export default function EmployerJobs() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [teaser, setTeaser] = useState('');

  useEffect(() => {
    if (!user || !token || user.role !== 'employer') return;

    setLoading(true);
    setError(null);

    fetch('http://localhost:4000/api/employer/jobs', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load employer jobs');
        }
        return res.json();
      })
      .then((data: EmployerJob[]) => {
        setJobs(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to load employer jobs');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, token]);

  if (!user || !token) {
    return <p>You must be logged in as an employer to view this page.</p>;
  }

  if (user.role !== 'employer') {
    return <p>Only employers can access this page.</p>;
  }

  const handleCreateJob = async (e: FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          company,
          location,
          description,
          teaser
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || 'Failed to create job';
        throw new Error(message);
      }

      setJobs((prev) => [...prev, data]);

      // reset form
      setTitle('');
      setCompany('');
      setLocation('');
      setDescription('');
      setTeaser('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!token) return;

    setDeletingId(jobId);
    setError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || 'Failed to delete job';
        throw new Error(message);
      }

      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1>Employer Jobs</h1>
      <p>Logged in as <strong>{user.email}</strong> (employer)</p>

      {loading && <p>Loading your jobs…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Your job posts</h2>
      {jobs.length === 0 && !loading && <p>You have no job posts yet.</p>}
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {jobs.map(job => (
          <li key={job.id} style={{ marginBottom: '1rem' }}>
            <strong>{job.title}</strong> – {job.company} ({job.location})
            <div>{job.teaser}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link to={`/employer/jobs/${job.id}/applications`}>View applications</Link>
              <button
                type="button"
                onClick={() => handleDeleteJob(job.id)}
                disabled={deletingId === job.id}
              >
                {deletingId === job.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <hr style={{ margin: '1.5rem 0' }} />

      <h2>Create a new job post</h2>
      <form
        onSubmit={handleCreateJob}
        style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >
        <label>
          Title
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </label>

        <label>
          Company
          <input value={company} onChange={e => setCompany(e.target.value)} required />
        </label>

        <label>
          Location
          <input value={location} onChange={e => setLocation(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Teaser (short summary, optional)
          <input value={teaser} onChange={e => setTeaser(e.target.value)} />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create job'}
        </button>
      </form>
    </div>
  );
}
