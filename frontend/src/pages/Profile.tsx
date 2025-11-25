import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type ProfileData = {
  id: number;
  email: string;
  role: 'jobseeker' | 'employer';
  isSubscribed: boolean;
  fullName?: string;
  gender?: string;
  age?: number;
  currentPosition?: string;
  visibility?: 'public' | 'private';
  summary?: string;
};

export default function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    fetch('http://localhost:4000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load profile');
        }
        return res.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, token]);

  if (!user || !token) {
    return <p>You must be logged in to view your profile.</p>;
  }

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [field]: field === 'age' ? (value ? Number(value) : undefined) : value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          gender: profile.gender,
          age: profile.age,
          currentPosition: profile.currentPosition,
          visibility: profile.visibility,
          summary: profile.summary
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.message || 'Failed to save profile';
        throw new Error(message);
      }

      const updated = (await res.json()) as ProfileData;
      setProfile(updated);
      setSuccess('Profile saved successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Job Seeker Profile</h1>
      <p>
        Logged in as <strong>{profile?.email}</strong> ({profile?.role})
      </p>

      {loading && <p>Loading profile…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      {!loading && profile && (
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <label>
            Full name
            <input
              type="text"
              value={profile.fullName ?? ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
          </label>

          <label>
            Gender
            <input
              type="text"
              value={profile.gender ?? ''}
              onChange={(e) => handleChange('gender', e.target.value)}
            />
          </label>

          <label>
            Age
            <input
              type="number"
              value={profile.age ?? ''}
              onChange={(e) => handleChange('age', e.target.value)}
            />
          </label>

          <label>
            Current position
            <input
              type="text"
              value={profile.currentPosition ?? ''}
              onChange={(e) => handleChange('currentPosition', e.target.value)}
            />
          </label>

          <label>
            Visibility
            <select
              value={profile.visibility ?? 'public'}
              onChange={(e) => handleChange('visibility', e.target.value)}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          <label>
            Summary
            <textarea
              rows={4}
              value={profile.summary ?? ''}
              onChange={(e) => handleChange('summary', e.target.value)}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      )}
    </div>
  );
}
