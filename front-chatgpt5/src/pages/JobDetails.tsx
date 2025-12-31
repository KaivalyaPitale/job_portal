import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Job } from "../types";
import { useAuth } from "../context/AuthContext";

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<Job>(`/jobs/${id}`);
        setJob(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token || !user || user.role !== "jobseeker") return;

    setApplyLoading(true);
    setMessage(null);
    setError(null);

    try {
      await apiFetch(`/jobs/${id}/apply`, {
        method: "POST",
        body: JSON.stringify(
          coverLetter.trim().length > 0 ? { coverLetter } : {}
        ),
      }, token);
      setMessage("Application submitted successfully.");
    } catch (err) {
      setError((err as Error).message || "Failed to submit application");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading && !job) {
    return <p>Loading job...</p>;
  }

  if (error && !job) {
    return (
      <p style={{ color: "red" }}>
        {error}
      </p>
    );
  }

  if (!job) {
    return <p>Job not found.</p>;
  }

  const canApply = !!user && user.role === "jobseeker";

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1>{job.title}</h1>
      <p style={{ margin: 0, fontSize: "0.95rem", color: "#4b5563" }}>
        {job.company} · {job.location}
      </p>
      <p style={{ marginTop: "1rem", whiteSpace: "pre-line" }}>{job.description}</p>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Apply for this job</h2>
        {!user && <p>You must be logged in as a job seeker to apply.</p>}
        {user && user.role === "employer" && (
          <p>Only job seekers can apply for jobs.</p>
        )}

        {canApply && (
          <form
            onSubmit={handleApply}
            style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Optional cover letter
              </label>
              <textarea
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              />
            </div>
            {message && (
              <p style={{ color: "green" }}>
                {message}
              </p>
            )}
            {error && (
              <p style={{ color: "red" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={applyLoading}
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
              {applyLoading ? "Submitting..." : "Apply"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default JobDetails;
