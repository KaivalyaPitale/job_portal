// File: frontend/src/pages/EmployerJobApplications.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Application {
  id: number;
  jobId: number;
  userId: number;
  applicantEmail: string;
  applicantName?: string;
  createdAt: string;
  coverLetter?: string;
  status: string;
}

interface JobInfo {
  id: number;
  title: string;
  company: string;
}

function EmployerJobApplications() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [job, setJob] = useState<JobInfo | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'employer' || !token) {
      setLoading(false);
      return;
    }

    fetchApplications();
  }, [user, token, id]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/employer/jobs/${id}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setJob(data.job);
      setApplications(data.applications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user || user.role !== 'employer') {
    return <div>You must be logged in as an employer to view applications.</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div>
      <Link to="/employer/jobs" style={{ display: 'block', marginBottom: '1rem' }}>
        ← Back to My Jobs
      </Link>

      <h1>Applications for {job.title}</h1>
      <p><strong>Company:</strong> {job.company}</p>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {applications.map((app) => (
            <div key={app.id} style={{ padding: '1rem', border: '1px solid #ccc' }}>
              <p><strong>Applicant:</strong> {app.applicantName || app.applicantEmail}</p>
              <p><strong>Email:</strong> {app.applicantEmail}</p>
              <p><strong>Applied:</strong> {new Date(app.createdAt).toLocaleString()}</p>
              {app.coverLetter && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Cover Letter:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{app.coverLetter}</p>
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ marginRight: '0.5rem' }}><strong>Status:</strong></label>
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                  style={{ padding: '0.5rem' }}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmployerJobApplications;