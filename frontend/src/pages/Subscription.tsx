import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Subscription() {
  const { user, token, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user || !token) {
    return <p>You must be logged in as a job seeker to manage your subscription.</p>;
  }

  if (user.role !== 'jobseeker') {
    return <p>Only job seekers can have subscriptions.</p>;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:4000/api/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || 'Failed to activate subscription';
        throw new Error(message);
      }

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          isSubscribed: data.user.isSubscribed
        });
      }

      setSuccess('Subscription activated.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:4000/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || 'Failed to cancel subscription';
        throw new Error(message);
      }

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          isSubscribed: data.user.isSubscribed
        });
      }

      setSuccess('Subscription cancelled.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Subscription</h1>
      <p>
        Logged in as <strong>{user.email}</strong> ({user.role})
      </p>

      <p>
        Current status:{' '}
        <strong>{user.isSubscribed ? 'Subscribed' : 'Not subscribed'}</strong>
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        {!user.isSubscribed && (
          <button onClick={handleSubscribe} disabled={loading}>
            {loading ? 'Processing…' : 'Subscribe'}
          </button>
        )}

        {user.isSubscribed && (
          <button onClick={handleCancel} disabled={loading}>
            {loading ? 'Processing…' : 'Cancel subscription'}
          </button>
        )}
      </div>

      <hr style={{ margin: '1.5rem 0' }} />

      <p>
        As a subscribed job seeker you could (in a more complete version of this app):
      </p>
      <ul>
        <li>Use extra search filters.</li>
        <li>Get personalized job recommendations.</li>
        <li>Reach out to HRs directly.</li>
      </ul>
    </div>
  );
}
