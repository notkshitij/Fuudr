import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const ATTEMPTS_KEY   = 'fuudr_sa_attempts';
const LOCKOUT_KEY    = 'fuudr_sa_lockout_until';
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutes

// Whitelisted Super Admin emails (always permitted)
const KNOWN_ADMIN_EMAILS = [
  'solvers.real@gmail.com',
];

const FOOD_IMAGES = [
  'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1049620/pexels-photo-1049620.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

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

export function SuperAdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth]       = useState(true);
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [show, setShow]                       = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');
  const [loading, setLoading]                 = useState(false);
  const [googleLoading, setGoogleLoading]     = useState(false);
  const [shake, setShake]                     = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [imgIndex]                            = useState(() => Math.floor(Math.random() * FOOD_IMAGES.length));
  const [lockedOut, setLockedOut]             = useState(() => getRemainingLockout() > 0);
  const [countdown, setCountdown]             = useState(() => getRemainingLockout());
  const [attempts, setAttempts]               = useState(() => parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || '0', 10));
  const timerRef                              = useRef(null);

  // Verify if an authenticated user is an authorized Super Admin
  const verifyAdminStatus = async (user) => {
    if (!user || !user.email) return false;
    const userEmail = user.email.trim().toLowerCase();

    // 1. Check hardcoded primary admin list
    if (KNOWN_ADMIN_EMAILS.includes(userEmail)) {
      return true;
    }

    // 2. Check app_metadata role (can only be set by the server, never by the user)
    if (user.app_metadata?.role === 'super_admin') {
      return true;
    }

    // 3. Check admin_users table in Supabase
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, is_active')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (!error && data && data.is_active !== false) {
        return true;
      }
    } catch {
      // Table check fallback
    }

    // 4. Check if email matches super_admin_email in admin_config
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('value')
        .eq('key', 'super_admin_email')
        .maybeSingle();

      if (!error && data?.value && data.value.toLowerCase() === userEmail) {
        return true;
      }
    } catch {
      // Ignore
    }

    return false;
  };

  // Check initial session
  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isSubscribed) {
          const isAuthorized = await verifyAdminStatus(session.user);
          if (isAuthorized) {
            setIsAuthenticated(true);
          } else {
            const unauthorizedEmail = session.user.email || 'this account';
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setErrorMsg(`Access Denied: ${unauthorizedEmail} is not authorized for Super Admin access.`);
          }
        }
      } catch {
        // Session fetch error
      } finally {
        if (isSubscribed) setCheckingAuth(false);
      }
    };

    checkSession();
    setTimeout(() => setMounted(true), 60);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isAuthorized = await verifyAdminStatus(session.user);
        if (isAuthorized) {
          setIsAuthenticated(true);
          setErrorMsg('');
        } else {
          const unauthorizedEmail = session.user.email || 'this account';
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setErrorMsg(`Access Denied: ${unauthorizedEmail} is not authorized for Super Admin access.`);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Tick countdown every second while locked out
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

  // Handle Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    if (lockedOut) return;
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/adminfuudr`,
        }
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setErrorMsg('Failed to initiate Google sign-in. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Handle Email + Password Sign-in
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || lockedOut) return;
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (authError || !data?.user) {
      setLoading(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      sessionStorage.setItem(ATTEMPTS_KEY, String(newAttempts));
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        sessionStorage.setItem(LOCKOUT_KEY, String(until));
        setCountdown(LOCKOUT_MS);
        setLockedOut(true);
        setPassword('');
        setErrorMsg(`Too many failed attempts. Locked out for ${formatCountdown(LOCKOUT_MS)}.`);
      } else {
        setErrorMsg(authError?.message || 'Invalid email or password.');
      }
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const isAuthorized = await verifyAdminStatus(data.user);
    setLoading(false);

    if (!isAuthorized) {
      await supabase.auth.signOut();
      setErrorMsg(`Access Denied: ${cleanEmail} is not authorized for Super Admin access.`);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    sessionStorage.removeItem(ATTEMPTS_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
    setIsAuthenticated(true);
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080809] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return children;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sa-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #080809;
        }

        .sa-left {
          display: none;
          position: relative;
          width: 55%;
          overflow: hidden;
          margin: 16px;
          border-radius: 28px;
        }
        @media (min-width: 860px) { .sa-left { display: block; } }

        .sa-left-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center;
          filter: brightness(0.55) saturate(0.9);
        }

        .sa-left-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            135deg,
            rgba(8,8,9,0.45) 0%,
            rgba(8,8,9,0.15) 50%,
            rgba(8,8,9,0.6) 100%
          );
        }

        .sa-left-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            rgba(8,8,9,0.92) 0%,
            rgba(8,8,9,0.3) 40%,
            transparent 70%
          );
        }

        .sa-left-content {
          position: absolute; inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 40px;
        }

        .sa-left-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .sa-left-logo {
          width: 34px; height: 34px;
          border-radius: 9px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sa-left-logo img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .sa-left-brand-name {
          font-size: 16px; font-weight: 700;
          color: #fff; letter-spacing: -0.2px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        .sa-left-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(249,115,22,0.15);
          border: 1px solid rgba(249,115,22,0.3);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 10px; font-weight: 700;
          color: #fb923c; letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .sa-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f97316;
          animation: blink 1.6s ease-in-out infinite;
        }
        .sa-left-heading {
          font-size: 32px; font-weight: 800;
          color: #fff; letter-spacing: -0.8px;
          line-height: 1.18;
          margin-bottom: 12px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .sa-left-heading span { color: #fb923c; }
        .sa-left-sub {
          font-size: 13px; color: rgba(255,255,255,0.5);
          font-weight: 400; line-height: 1.65;
          max-width: 320px;
        }

        .sa-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: #080809;
          position: relative;
        }
        .sa-right::before {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        .sa-form-wrap {
          width: 100%; max-width: 360px;
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                      transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .sa-form-wrap.mounted { opacity: 1; transform: translateY(0); }
        .sa-form-wrap.shake { animation: shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97); }

        .sa-eyebrow {
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.8px; text-transform: uppercase;
          color: #f97316; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .sa-title {
          font-size: 26px; font-weight: 800;
          color: #fff; letter-spacing: -0.6px; margin-bottom: 6px;
        }
        .sa-subtitle {
          font-size: 13px; color: rgba(255,255,255,0.35);
          font-weight: 400; margin-bottom: 24px; line-height: 1.5;
        }

        .sa-google-btn {
          width: 100%;
          padding: 13px 16px;
          background: #ffffff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          margin-bottom: 20px;
        }
        .sa-google-btn:hover:not(:disabled) {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255,255,255,0.1);
        }
        .sa-google-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sa-or-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .sa-or-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .sa-or-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
        }

        .sa-field-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.9px; text-transform: uppercase;
          color: rgba(255,255,255,0.4); margin-bottom: 8px;
          display: block;
        }
        .sa-input-wrap { position: relative; margin-bottom: 16px; }
        .sa-input {
          width: 100%;
          padding: 13px 46px 13px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px;
          color: #fff;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          outline: none;
          transition: border-color 0.18s, background 0.18s;
          -webkit-appearance: none;
        }
        .sa-input::placeholder { color: rgba(255,255,255,0.2); }
        .sa-input:focus {
          border-color: rgba(249,115,22,0.5);
          background: rgba(255,255,255,0.06);
        }
        .sa-input.err {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.05);
        }
        .sa-toggle {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); padding: 4px;
          display: flex; align-items: center;
          transition: color 0.15s;
          font-family: inherit;
        }
        .sa-toggle:hover { color: rgba(255,255,255,0.7); }
        .sa-error {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12px; font-weight: 500;
          color: #f87171; margin-bottom: 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          padding: 10px 12px;
          border-radius: 10px;
          line-height: 1.4;
        }
        .sa-btn {
          width: 100%; padding: 13px;
          background: #f97316;
          border: none; border-radius: 11px;
          color: #fff;
          font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 18px rgba(249,115,22,0.28);
          margin-top: 8px;
        }
        .sa-btn:hover:not(:disabled) {
          background: #ea6d10;
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(249,115,22,0.36);
        }
        .sa-btn:active:not(:disabled) { transform: translateY(0); }
        .sa-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sa-footer {
          display: flex; align-items: center; gap: 10px;
          margin-top: 28px;
        }
        .sa-footer-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .sa-footer-text {
          font-size: 11px; color: rgba(255,255,255,0.18);
          font-weight: 500; white-space: nowrap;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-10px); }
          30%      { transform: translateX(10px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          80%      { transform: translateX(-3px); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sa-root">

        {/* ── LEFT: Food image panel ── */}
        <div className="sa-left">
          <img src={FOOD_IMAGES[imgIndex]} alt="Food" className="sa-left-img" />
          <div className="sa-left-overlay" />
          <div className="sa-left-gradient" />

          <div className="sa-left-content">
            <div className="sa-left-brand">
              <div className="sa-left-logo">
                <img src="/favicon.png" alt="Fuudr" />
              </div>
              <span className="sa-left-brand-name">Fuudr</span>
            </div>

            <div>
              <div className="sa-left-tag">
                <span className="sa-live-dot" />
                Live Command Center
              </div>
              <h2 className="sa-left-heading">
                Protected <span>Super Admin</span> Portal
              </h2>
              <p className="sa-left-sub">
                Secured administrative access for operations, orders, dispatching, and partner management.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="sa-right">
          <div className={`sa-form-wrap${mounted ? ' mounted' : ''}${shake ? ' shake' : ''}`}>

            <p className="sa-eyebrow">
              <ShieldCheck size={14} />
              Fuudr Admin Security
            </p>
            <h1 className="sa-title">Admin Sign In</h1>
            <p className="sa-subtitle">Sign in with your authorized Google Admin account.</p>

            {/* ── Google OAuth Button ── */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={lockedOut || googleLoading}
              className="sa-google-btn"
            >
              {googleLoading ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    style={{ animation: 'spin 0.75s linear infinite' }}>
                    <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.2)" strokeWidth="2.5"/>
                    <path d="M12 3a9 9 0 0 1 9 9" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="sa-or-divider">
              <div className="sa-or-line" />
              <span className="sa-or-text">or email</span>
              <div className="sa-or-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <label className="sa-field-label">Admin Email</label>
              <div className="sa-input-wrap">
                <input
                  className={`sa-input${errorMsg && !lockedOut ? ' err' : ''}`}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="admin@fuudr.com"
                  disabled={lockedOut || loading}
                />
              </div>

              <label className="sa-field-label">Password</label>
              <div className="sa-input-wrap">
                <input
                  className={`sa-input${errorMsg ? ' err' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                  placeholder={lockedOut ? 'Access locked' : '••••••••••••'}
                  disabled={lockedOut || loading}
                />
                <button 
                  type="button" 
                  className="sa-toggle" 
                  onClick={() => setShow(s => !s)} 
                  tabIndex={-1} 
                  disabled={lockedOut || loading}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {lockedOut && (
                <div className="sa-error">
                  <Lock size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Too many failed attempts. Try again in <strong>{formatCountdown(countdown)}</strong>
                  </span>
                </div>
              )}

              {errorMsg && !lockedOut && (
                <div className="sa-error">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {errorMsg}
                    {MAX_ATTEMPTS - attempts > 0 && attempts > 0 && (
                      <span className="block opacity-75 mt-0.5">
                        {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining.
                      </span>
                    )}
                  </span>
                </div>
              )}

              <button type="submit" className="sa-btn" disabled={loading || !email || !password || lockedOut}>
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin 0.75s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"/>
                      <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Authenticating...
                  </>
                ) : lockedOut ? (
                  <>Locked — {formatCountdown(countdown)}</>
                ) : (
                  <>
                    Sign In with Password
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="sa-footer">
              <div className="sa-footer-line" />
              <span className="sa-footer-text">© 2025 Fuudr Inc. · Internal Only</span>
              <div className="sa-footer-line" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
