import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { EmployerJob } from "../types";
import { useAuth } from "../context/AuthContext";

const EmployerJobs: React.FC = () => {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [teaser, setTeaser] = useState("");

  const isEmployer = user && user.role === "employer";

  useEffect(() => {
    if (!isEmployer || !token) return;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<EmployerJob[]>("/employer/jobs", {}, token);
        setJobs(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, [isEmployer, token]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    setCreateError(null);
    try {
      const job = await apiFetch<EmployerJob>(
        "/employer/jobs",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            company,
            location,
            description,
            teaser: teaser || undefined,
          }),
        },
        token
      );
      setJobs((prev) => [...prev, job]);
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setTeaser("");
    } catch (err) {
      setCreateError((err as Error).message || "Failed to create job");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this job and its applications?")) {
      return;
    }

    try {
      await apiFetch<{ message: string }>(`/employer/jobs/${jobId}`, { method: "DELETE" }, token);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      alert((err as Error).message || "Failed to delete job");
    }
  };

  if (!user || user.role !== "employer") {
    return <p>You must be logged in as an employer to manage jobs.</p>;
  }

  return (
    <div>
      <h1>Employer Jobs</h1>

      <section style={{ marginTop: "1rem" }}>
        <h2>Your job postings</h2>
        {loading && <p>Loading jobs...</p>}
        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}
        {!loading && !error && jobs.length === 0 && <p>You have not posted any jobs yet.</p>}
        <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem" }}>
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
              <h3 style={{ margin: "0 0 0.25rem 0" }}>{job.title}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563" }}>
                {job.company} · {job.location}
              </p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{job.teaser}</p>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <Link to={`/employer/jobs/${job.id}/applications`}>View applications</Link>
                <button
                  type="button"
                  onClick={() => void handleDeleteJob(job.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #ef4444",
                    backgroundColor: "white",
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem", maxWidth: "640px" }}>
        <h2>Create a new job</h2>
        <form
          onSubmit={handleCreateJob}
          style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Company
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Description
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Teaser (short summary, optional)
            </label>
            <textarea
              rows={2}
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          {createError && (
            <p style={{ color: "red" }}>
              {createError}
            </p>
          )}
          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {creating ? "Creating..." : "Create job"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default EmployerJobs;
