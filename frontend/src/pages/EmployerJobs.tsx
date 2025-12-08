// File: frontend/src/pages/EmployerJobs.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  teaser: string;
}

function EmployerJobs() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    teaser: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'employer' || !token) {
      setLoading(false);
      return;
    }

    fetchJobs();
  }, [user, token]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/employer/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setCreating(true);

    try {
      const response = await fetch('http://localhost:4000/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create job');
      }

      const newJob = await response.json();
      setJobs([...jobs, newJob]);
      setFormData({ title: '', company: '', location: '', description: '', teaser: '' });
      setMessage('Job created successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete job');

      setJobs(jobs.filter(j => j.id !== jobId));
      setMessage('Job deleted successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user || user.role !== 'employer') {
    return <div>You must be logged in as an employer to manage jobs.</div>;
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Job Postings</h1>

      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '3rem' }}>
        <h2>Your Jobs</h2>
        {jobs.length === 0 ? (
          <p>You have not posted any jobs yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map((job) => (
              <div key={job.id} style={{ padding: '1rem', border: '1px solid #ccc' }}>
                <h3>{job.title}</h3>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p>{job.teaser}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <Link to={`/employer/jobs/${job.id}/applications`}>
                    <button style={{ padding: '0.5rem 1rem' }}>View Applications</button>
                  </Link>
                  <button 
                    onClick={() => handleDeleteJob(job.id)}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '2px solid #ccc', paddingTop: '2rem' }}>
        <h2>Create New Job</h2>
        <form onSubmit={handleCreateJob}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teaser (optional)</label>
            <input
              type="text"
              value={formData.teaser}
              onChange={(e) => setFormData({ ...formData, teaser: e.target.value })}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <button type="submit" disabled={creating} style={{ padding: '0.5rem 1rem' }}>
            {creating ? 'Creating...' : 'Create Job'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmployerJobs;