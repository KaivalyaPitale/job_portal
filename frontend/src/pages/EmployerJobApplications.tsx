import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ApplicationStatus = 'pending' | 'reviewed' | 'rejected' | 'accepted';

type ApplicationItem = {
  id: number;
  jobId: number;
  userId: number;
  applicantEmail?: string;
  applicantName?: string;
  createdAt: string;
  coverLetter?: string;
  status: ApplicationStatus;
};

type JobApplicationsResponse = {
  job: {
    id: number;
    title: string;
    company: string;
  };
  applications: ApplicationItem[];
};

const STATUSES: ApplicationStatus[] = ['pending', 'reviewed', 'rejected', 'accepted'];

export default function EmployerJobApplications() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [data, setData] = useState<JobApplicationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !token || user.role !== 'employer') return;

    setLoading(true);
    setError(null);

    fetch(`http://localhost:4000/api/employer/jobs/${id}/applications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load applications');
        }
        return res.json();
      })
      .then((data: JobApplicationsResponse) => {
        setData(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to load applications');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, user, token]);

  if (!id) return <p>No job id provided.</p>;
  if (!user || !token) return <p>You must be logged in as an employer to view this page.</p>;
  if (user.role !== 'employer') return <p>Only employers can view applications.</p>;

  if (loading) return <p>Loading applications…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>No data loaded.</p>;

  const { job, applications } = data;

  const handleStatusChange = async (appId: number, newStatus: ApplicationStatus) => {
    if (!token) return;

    setUpdatingId(appId);
    setUpdateError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/employer/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const message = payload?.message || 'Failed to update status';
        throw new Error(message);
      }

      // Update local state
      setData(prev =>
        prev
          ? {
              ...prev,
              applications: prev.applications.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
              )
            }
          : prev
      );
    } catch (err: any) {
      console.error(err);
      setUpdateError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <h1>Applications for {job.title}</h1>
      <p><strong>Company:</strong> {job.company}</p>

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {applications.map(app => (
            <li
              key={app.id}
              style={{
                marginBottom: '1rem',
                borderBottom: '1px solid #ddd',
                paddingBottom: '0.5rem'
              }}
            >
              <p>
                <strong>Applicant:</strong>{' '}
                {app.applicantName
                  ? `${app.applicantName} (${app.applicantEmail})`
                  : app.applicantEmail ?? `User ${app.userId}`}
              </p>
              <p><strong>Submitted:</strong> {new Date(app.createdAt).toLocaleString()}</p>
              {app.coverLetter && (
                <p>
                  <strong>Cover letter:</strong> {app.coverLetter}
                </p>
              )}

              <label>
                <strong>Status: </strong>
                <select
                  value={app.status}
                  onChange={e =>
                    handleStatusChange(app.id, e.target.value as ApplicationStatus)
                  }
                  disabled={updatingId === app.id}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}

      {updateError && <p style={{ color: 'red' }}>{updateError}</p>}
    </div>
  );
}
