import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { AuthUser, Role } from "../types";

const Register: React.FC = () => {
  const [email, setEmail] = useState("jobseeker@example.com");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState<Role>("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<AuthUser>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
      setSuccess("Registration successful. You can now log in.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "420px" }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
          >
            <option value="jobseeker">Job seeker</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        {error && (
          <p style={{ color: "red", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: "green", fontSize: "0.9rem" }}>
            {success}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "0.375rem",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
