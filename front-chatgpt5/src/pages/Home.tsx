import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Job } from "../types";

const Home: React.FC = () => {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async (params?: { q?: string; location?: string; company?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set("q", params.q);
      if (params?.location) searchParams.set("location", params.location);
      if (params?.company) searchParams.set("company", params.company);

      const queryString = searchParams.toString();
      const path = queryString ? `/jobs?${queryString}` : "/jobs";

      const data = await apiFetch<Job[]>(path);
      setJobs(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load with no filters
    void loadJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadJobs({ q, location, company });
  };

  return (
    <div>
      <h1>Find your next job</h1>
      <form
        onSubmit={handleSearch}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0",
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            Keyword
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, company, skills..."
            style={{ width: "100%", padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Remote..."
            style={{ width: "100%", padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            style={{ width: "100%", padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {loading && <p>Loading jobs...</p>}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && jobs.length === 0 && <p>No jobs found.</p>}

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {jobs.map((job) => (
          <li
            key={job.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              marginBottom: "0.75rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.25rem 0" }}>
              <Link to={`/jobs/${job.id}`}>{job.title}</Link>
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563" }}>
              {job.company} · {job.location}
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>{job.teaser}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
