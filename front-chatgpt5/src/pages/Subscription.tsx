import React, { useState } from "react";
import { apiFetch } from "../api/client";
import type { AuthUser } from "../types";
import { useAuth } from "../context/AuthContext";

const Subscription: React.FC = () => {
  const { user, token, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <p>You must be logged in to manage subscriptions.</p>;
  }

  const handleSubscribeChange = async (action: "subscribe" | "cancel") => {
    if (!token || user.role !== "jobseeker") return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<{ message: string; user: AuthUser }>(
        `/subscription/${action}`,
        { method: "POST" },
        token
      );
      // keep token, update user
      login(data.user, token);
      setMessage(data.message);
    } catch (err) {
      setError((err as Error).message || "Subscription change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "540px" }}>
      <h1>Subscription</h1>
      <p>
        Signed in as <strong>{user.email}</strong> ({user.role})
      </p>

      {user.role !== "jobseeker" && (
        <p>Only job seekers can have subscriptions.</p>
      )}

      {user.role === "jobseeker" && (
        <>
          <p>
            Current status:{" "}
            <strong>{user.isSubscribed ? "Subscribed" : "Not subscribed"}</strong>
          </p>
          <div style={{ display: "flex", gap: "0.75rem", margin: "0.75rem 0" }}>
            {!user.isSubscribed && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSubscribeChange("subscribe")}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#16a34a",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {loading ? "Processing..." : "Subscribe"}
              </button>
            )}
            {user.isSubscribed && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSubscribeChange("cancel")}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #ef4444",
                  backgroundColor: "white",
                  color: "#b91c1c",
                  cursor: "pointer",
                }}
              >
                {loading ? "Processing..." : "Cancel subscription"}
              </button>
            )}
          </div>
        </>
      )}

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
    </div>
  );
};

export default Subscription;
