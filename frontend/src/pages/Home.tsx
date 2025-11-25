import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  teaser: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // search filters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');

  const fetchJobs = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (location.trim()) params.set('location', location.trim());
    if (company.trim()) params.set('company', company.trim());

    const url =
      params.toString().length > 0
        ? `http://localhost:4000/api/jobs?${params.toString()}`
        : 'http://localhost:4000/api/jobs';

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load jobs');
        }
        return res.json();
      })
      .then((data: Job[]) => {
        setJobs(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to load jobs');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // initial load
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div>
      <h1>Job Search</h1>

      {/* Search form */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <input
          placeholder="Keyword (title, skills...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button type="submit">Search</button>
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setLocation('');
            setCompany('');
            fetchJobs();
          }}
        >
          Clear
        </button>
      </form>

      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

      {!loading && !error && jobs.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {jobs.map((job) => (
            <li key={job.id} style={{ marginBottom: '1rem' }}>
              <Link to={`/jobs/${job.id}`}>
                <strong>{job.title}</strong>
              </Link>{' '}
              – {job.company} ({job.location})
              <div>{job.teaser}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
