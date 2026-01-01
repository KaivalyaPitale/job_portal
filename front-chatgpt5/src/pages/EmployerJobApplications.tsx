import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { EmployerJobApplication, ApplicationStatus } from "../types";
import { useAuth } from "../context/AuthContext";

interface JobSummary {
  id: number;
  title: string;
  company: string;
}

interface EmployerApplicationsResponse {
  job: JobSummary;
  applications: EmployerJobApplication[];
}

const EmployerJobApplications: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [job, setJob] = useState<JobSummary | null>(null);
  const [applications, setApplications] = useState<EmployerJobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<number[]>([]);

  const isEmployer = user && user.role === "employer";

  useEffect(() => {
    if (!isEmployer || !token || !id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<EmployerApplicationsResponse>(
          `/employer/jobs/${id}/applications`,
          {},
          token
        );
        setJob(data.job);
        setApplications(data.applications);
      } catch (err) {
        setError((err as Error).message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, isEmployer, token]);

  const handleStatusChange = async (applicationId: number, status: ApplicationStatus) => {
    if (!token) return;

    setSavingIds((prev) => [...prev, applicationId]);
    try {
      const data = await apiFetch<{ message: string; application: EmployerJobApplication }>(
        `/employer/applications/${applicationId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        token
      );
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? data.application : app))
      );
    } catch (err) {
      alert((err as Error).message || "Failed to update status");
    } finally {
      setSavingIds((prev) => prev.filter((idVal) => idVal !== applicationId));
    }
  };

  if (!user || user.role !== "employer") {
    return <p>You must be logged in as an employer to view applications.</p>;
  }

  if (loading && !job) {
    return <p>Loading applications...</p>;
  }

  if (error && !job) {
    return (
      <p style={{ color: "red" }}>
        {error}
      </p>
    );
  }

  if (!id) {
    return <p>Invalid job id.</p>;
  }

  return (
    <div>
      <h1>Job Applications</h1>
      {job && (
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ marginBottom: "0.25rem" }}>
            {job.title}
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563" }}>
            {job.company}
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <Link to="/employer/jobs">Back to your jobs</Link>
          </p>
        </div>
      )}
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
      {!loading && !error && applications.length === 0 && (
        <p>No applications for this job yet.</p>
      )}
      <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem" }}>
        {applications.map((app) => {
          const saving = savingIds.includes(app.id);
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                <div>
                  <p style={{ margin: 0 }}>
                    <strong>{app.applicantName || "Unknown applicant"}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563" }}>
                    {app.applicantEmail}
                  </p>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                    Submitted: {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: "right", minWidth: "150px" }}>
                  <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.25rem" }}>
                    Status
                  </label>
                  <select
                    value={app.status}
                    disabled={saving}
                    onChange={(e) =>
                      void handleStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
                    style={{
                      width: "100%",
                      padding: "0.3rem 0.4rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
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

export default EmployerJobApplications;
