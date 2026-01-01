import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { JobseekerApplication } from "../types";
import { useAuth } from "../context/AuthContext";

const MyApplications: React.FC = () => {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<JobseekerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token || user.role !== "jobseeker") return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<{ applications: JobseekerApplication[] }>(
          "/jobseeker/applications",
          {},
          token
        );
        setApplications(data.applications);
      } catch (err) {
        setError((err as Error).message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, token]);

  if (!user || user.role !== "jobseeker") {
    return <p>You must be logged in as a job seeker to view your applications.</p>;
  }

  return (
    <div>
      <h1>My Applications</h1>
      {loading && <p>Loading applications...</p>}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
      {!loading && !error && applications.length === 0 && (
        <p>You have not applied to any jobs yet.</p>
      )}
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {applications.map((app) => {
          const job = app.job;
          return (
            <li
              key={app.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <div>
                  {job ? (
                    <>
                      <h3 style={{ margin: "0 0 0.25rem 0" }}>
                        <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563" }}>
                        {job.company} · {job.location}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>(Job removed)</p>
                  )}
                </div>
                <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
                  <div>
                    Status:{" "}
                    <strong style={{ textTransform: "capitalize" }}>{app.status}</strong>
                  </div>
                  <div>
                    Applied: {new Date(app.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              {app.coverLetter && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  <strong>Cover letter: </strong>
                  {app.coverLetter}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MyApplications;
