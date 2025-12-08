// File: frontend/src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  teaser: string;
}

function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    q: '',
    location: '',
    company: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (params?: typeof searchParams) => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.q) queryParams.append('q', params.q);
        if (params.location) queryParams.append('location', params.location);
        if (params.company) queryParams.append('company', params.company);
      }

      const url = `http://localhost:4000/api/jobs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(searchParams);
  };

  return (
    <div>
      <h1>Job Search</h1>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Keyword:</label>
            <input
              type="text"
              value={searchParams.q}
              onChange={(e) => setSearchParams({ ...searchParams, q: e.target.value })}
              placeholder="Title, description, company..."
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location:</label>
            <input
              type="text"
              value={searchParams.location}
              onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              placeholder="City, state..."
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company:</label>
            <input
              type="text"
              value={searchParams.company}
              onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
              placeholder="Company name..."
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Search</button>
      </form>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <h2>Jobs ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ padding: '1rem', border: '1px solid #ccc' }}>
                  <h3>
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p><strong>Company:</strong> {job.company}</p>
                  <p><strong>Location:</strong> {job.location}</p>
                  <p>{job.teaser}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;