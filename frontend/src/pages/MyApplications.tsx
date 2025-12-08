// File: frontend/src/pages/MyApplications.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Application {
  id: number;
  jobId: number;
  createdAt: string;
  coverLetter?: string;
  status: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
  } | null;
}

function MyApplications() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'jobseeker' || !token) {
      setLoading(false);
      return;
    }

    fetchApplications();
  }, [user, token]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/jobseeker/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data.applications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'jobseeker') {
    return <div>You must be logged in as a job seeker to view your applications.</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h1>My Applications</h1>
      
      {applications.length === 0 ? (
        <p>You have not applied to any jobs yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => (
            <div key={app.id} style={{ padding: '1rem', border: '1px solid #ccc' }}>
              {app.job ? (
                <>
                  <h3>
                    <Link to={`/jobs/${app.job.id}`}>{app.job.title}</Link>
                  </h3>
                  <p><strong>Company:</strong> {app.job.company}</p>
                  <p><strong>Location:</strong> {app.job.location}</p>
                </>
              ) : (
                <h3>(Job removed)</h3>
              )}
              <p><strong>Status:</strong> {app.status}</p>
              <p><strong>Applied:</strong> {new Date(app.createdAt).toLocaleString()}</p>
              {app.coverLetter && (
                <p><strong>Cover Letter:</strong> {app.coverLetter}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyApplications;