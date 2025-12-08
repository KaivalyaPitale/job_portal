// File: frontend/src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    currentPosition: '',
    visibility: 'private',
    summary: '',
  });

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setFormData({
        fullName: data.fullName || '',
        gender: data.gender || '',
        age: data.age ? String(data.age) : '',
        currentPosition: data.currentPosition || '',
        visibility: data.visibility || 'private',
        summary: data.summary || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? Number(formData.age) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>You must be logged in to view your profile.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Profile</h1>
      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name:</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Gender:</label>
          <input
            type="text"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Age:</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Position:</label>
          <input
            type="text"
            value={formData.currentPosition}
            onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Visibility:</label>
          <select
            value={formData.visibility}
            onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Summary:</label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={5}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

export default Profile;