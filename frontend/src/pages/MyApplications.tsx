import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ApplicationStatus = 'pending' | 'reviewed' | 'rejected' | 'accepted';

type MyApplication = {
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
};

type ResponseShape = {
  applications: MyApplication[];
};

export default function MyApplications() {
  const { user, token } = useAuth();
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token || user.role !== 'jobseeker') return;

    setLoading(true);
    setError(null);

    fetch('http://localhost:4000/api/jobseeker/applications', {
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
      .then((data: ResponseShape) => {
        setApps(data.applications);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to load applications');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, token]);

  if (!user || !token) {
    return <p>You must be logged in as a job seeker to view your applications.</p>;
  }

  if (user.role !== 'jobseeker') {
    return <p>Only job seekers can view this page.</p>;
  }

  return (
    <div>
      <h1>My Applications</h1>

      {loading && <p>Loading your applications…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && apps.length === 0 && (
        <p>You have not applied for any jobs yet.</p>
      )}

      {!loading && !error && apps.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {apps.map(app => (
            <li
              key={app.id}
              style={{
                marginBottom: '1rem',
                borderBottom: '1px solid #ddd',
                paddingBottom: '0.5rem'
              }}
            >
              <p>
                <strong>Job:</strong>{' '}
                {app.job ? (
                  <Link to={`/jobs/${app.job.id}`}>
                    {app.job.title} – {app.job.company} ({app.job.location})
                  </Link>
                ) : (
                  <span>(Job removed)</span>
                )}
              </p>
              <p>
                <strong>Applied on:</strong>{' '}
                {new Date(app.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {app.status}
              </p>
              {app.coverLetter && (
                <p>
                  <strong>Cover letter:</strong> {app.coverLetter}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
