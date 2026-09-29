import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

const SESSION_KEY  = 'fuudr_backstage_auth';
const ATTEMPTS_KEY = 'fuudr_bs_attempts';
const LOCKOUT_KEY  = 'fuudr_bs_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

function getRemainingLockout() {
  const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  return Math.max(0, until - Date.now());
}

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [error, setError]                     = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [lockedOut, setLockedOut]             = useState(() => getRemainingLockout() > 0);
  const [countdown, setCountdown]             = useState(() => getRemainingLockout());
  const [attempts, setAttempts]               = useState(() => parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || '0', 10));
  const timerRef                              = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setIsAuthenticated(true);
  }, []);

  // Tick countdown every 500ms while locked out
  useEffect(() => {
    if (lockedOut) {
      timerRef.current = setInterval(() => {
        const remaining = getRemainingLockout();
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          sessionStorage.removeItem(LOCKOUT_KEY);
          sessionStorage.removeItem(ATTEMPTS_KEY);
          setAttempts(0);
          setLockedOut(false);
        }
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [lockedOut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || lockedOut) return;
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'backstage_password')
      .single();
    setLoading(false);

    if (!dbError && data?.value && password === data.value) {
      sessionStorage.removeItem(ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      sessionStorage.setItem(ATTEMPTS_KEY, String(newAttempts));
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        sessionStorage.setItem(LOCKOUT_KEY, String(until));
        setCountdown(LOCKOUT_MS);
        setLockedOut(true);
        setPassword('');
      }
      setError(true);
    }
  };

  if (isAuthenticated) return children;

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      color: '#fff',
      flexDirection: 'column',
      fontFamily: 'var(--sans)'
    }}>
      <h2 style={{ fontFamily: 'var(--xl)', fontSize: '32px', marginBottom: '8px' }}>Admin Access</h2>
      <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>Please enter the portal password.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder={lockedOut ? 'Access locked' : 'Enter Password'}
          autoFocus
          disabled={lockedOut}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: (error || lockedOut) ? '1px solid #ef4444' : '1px solid #333',
            background: '#111',
            color: '#fff',
            outline: 'none',
            fontSize: '16px',
            textAlign: 'center',
            letterSpacing: '2px',
            opacity: lockedOut ? 0.5 : 1,
            cursor: lockedOut ? 'not-allowed' : 'text',
          }}
        />

        {lockedOut && (
          <span style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>
            🔒 Too many attempts. Try again in {formatCountdown(countdown)}
          </span>
        )}

        {error && !lockedOut && (
          <span style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>
            Incorrect password.{' '}
            {MAX_ATTEMPTS - attempts > 0 && (
              <span style={{ opacity: 0.7 }}>
                {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} left.
              </span>
            )}
          </span>
        )}

        <button
          type="submit"
          disabled={loading || !password || lockedOut}
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: lockedOut ? '#333' : 'var(--acc)',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            cursor: (loading || lockedOut) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: (loading || lockedOut) ? 0.6 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
        >
          {loading ? 'Verifying...' : lockedOut ? `Locked — ${formatCountdown(countdown)}` : 'Enter Portal'}
        </button>
      </form>
    </div>
  );
}
