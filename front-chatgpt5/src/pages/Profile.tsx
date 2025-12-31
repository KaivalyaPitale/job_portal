import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import type { Profile as ProfileType } from "../types";
import { useAuth } from "../context/AuthContext";

const Profile: React.FC = () => {
  const { user, token, login } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<ProfileType>("/profile", {}, token);
        setProfile(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user, token]);

  const handleChange = (field: keyof ProfileType, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [field]: field === "age" ? (value === "" ? undefined : Number(value)) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !profile) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const body = {
      fullName: profile.fullName ?? "",
      gender: profile.gender ?? "",
      age: profile.age ?? undefined,
      currentPosition: profile.currentPosition ?? "",
      visibility: profile.visibility ?? "private",
      summary: profile.summary ?? "",
    };

    try {
      const updated = await apiFetch<ProfileType>("/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }, token);
      setProfile(updated);

      // Keep auth user in sync (email/role/isSubscribed)
      const { id, email, role, isSubscribed } = updated;
      login({ id, email, role, isSubscribed }, token);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError((err as Error).message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <p>You must be logged in to view your profile.</p>;
  }

  if (loading && !profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1>Your Profile</h1>
      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
      {message && (
        <p style={{ color: "green" }}>
          {message}
        </p>
      )}
      {!profile && !loading && <p>No profile information available.</p>}
      {profile && (
        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Full name
            </label>
            <input
              type="text"
              value={profile.fullName || ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Gender
              </label>
              <input
                type="text"
                value={profile.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Age
              </label>
              <input
                type="number"
                min={0}
                value={profile.age?.toString() ?? ""}
                onChange={(e) => handleChange("age", e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                Visibility
              </label>
              <select
                value={profile.visibility || "private"}
                onChange={(e) => handleChange("visibility", e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Current position
            </label>
            <input
              type="text"
              value={profile.currentPosition || ""}
              onChange={(e) => handleChange("currentPosition", e.target.value)}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Summary
            </label>
            <textarea
              value={profile.summary || ""}
              onChange={(e) => handleChange("summary", e.target.value)}
              rows={4}
              style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
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
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;
