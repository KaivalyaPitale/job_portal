// File: frontend/src/pages/JobDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
}

function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/jobs/${id}`);
      if (!response.ok) throw new Error('Job not found');
      const data = await response.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || !token) return;
    
    setError('');
    setMessage('');
    setApplying(true);

    try {
      const response = await fetch(`http://localhost:4000/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ coverLetter: coverLetter || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          throw new Error('You have already applied to this job.');
        }
        throw new Error(data.message || 'Failed to apply');
      }

      setMessage('Application submitted successfully!');
      setCoverLetter('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error && !job) return <div style={{ color: 'red' }}>{error}</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'block', marginBottom: '1rem' }}>← Back to Jobs</Link>
      
      <h1>{job.title}</h1>
      <p><strong>Company:</strong> {job.company}</p>
      <p><strong>Location:</strong> {job.location}</p>
      
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <h2>Description</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
      </div>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: '2rem' }}>
        <h2>Apply for this job</h2>
        
        {!user ? (
          <p>You must be logged in as a job seeker to apply.</p>
        ) : user.role !== 'jobseeker' ? (
          <p>Only job seekers can apply for jobs.</p>
        ) : (
          <div>
            {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Cover Letter (optional):
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                style={{ width: '100%', padding: '0.5rem' }}
                placeholder="Tell us why you're a great fit for this role..."
              />
            </div>
            
            <button 
              onClick={handleApply} 
              disabled={applying}
              style={{ padding: '0.5rem 1rem' }}
            >
              {applying ? 'Submitting...' : 'Apply'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetails;