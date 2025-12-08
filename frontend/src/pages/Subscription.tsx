// File: frontend/src/pages/Subscription.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Subscription() {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    if (!user || !token) return;
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to subscribe');
      }

      const data = await response.json();
      updateUser({ isSubscribed: true });
      setMessage('Subscription activated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !token) return;
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      const data = await response.json();
      updateUser({ isSubscribed: false });
      setMessage('Subscription cancelled successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>You must be logged in to manage subscriptions.</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Subscription Management</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.isSubscribed ? 'Subscribed' : 'Not subscribed'}</p>
      </div>

      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {user.role === 'jobseeker' ? (
        <div>
          {!user.isSubscribed ? (
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              style={{ padding: '0.5rem 1rem' }}
            >
              {loading ? 'Processing...' : 'Subscribe'}
            </button>
          ) : (
            <button 
              onClick={handleCancel} 
              disabled={loading}
              style={{ padding: '0.5rem 1rem' }}
            >
              {loading ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      ) : (
        <p>Only job seekers can have subscriptions.</p>
      )}
    </div>
  );
}

export default Subscription;