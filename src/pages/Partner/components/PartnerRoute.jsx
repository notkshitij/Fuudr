import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ShieldCheck, ArrowRight, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../../supabaseClient';

const ATTEMPTS_KEY = 'fuudr_partner_attempts';
const LOCKOUT_KEY  = 'fuudr_partner_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes

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

export function PartnerAuthForm({ onAuthenticated, initialEmail = '' }) {
  const navigate = useNavigate();
  const [email, setEmail]         = useState(initialEmail);
  const [password, setPassword]   = useState('');
  const [show, setShow]           = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [shake, setShake]         = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [imgIndex]                = useState(() => Math.floor(Math.random() * FOOD_IMAGES.length));
  const [lockedOut, setLockedOut] = useState(() => getRemainingLockout() > 0);
  const [countdown, setCountdown] = useState(() => getRemainingLockout());
  const [attempts, setAttempts]   = useState(() => parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || '0', 10));
  const timerRef                  = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  // Countdown timer during lockout
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
    if (!email || !password || lockedOut) return;
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      let partnerData = null;

      // 1. Primary: Authenticate via Supabase Auth service
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!authError && authData?.user) {
        // Fetch full restaurant partner profile from database
        const { data: profileData } = await supabase
          .from('partners')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (profileData) {
          partnerData = profileData;
        } else {
          // If profile table doesn't have it under email, build fallback from auth metadata
          partnerData = {
            id: authData.user.id,
            email: cleanEmail,
            restaurant_name: authData.user.user_metadata?.restaurant_name || 'Restaurant Partner',
            owner_name: authData.user.user_metadata?.owner_name || '',
            mobile_number: authData.user.user_metadata?.mobile_number || '',
            opening_time: '09:00 AM'
          };
        }
      }

      // 2. Secondary / Fallback: If not in Supabase Auth yet, check partners database
      if (!partnerData) {
        // Try login_partner RPC
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('login_partner', {
              p_email: cleanEmail,
              p_password: password,
            });

          if (!rpcError && rpcData) {
            partnerData = rpcData;
          }
        } catch (rpcErr) {
          console.warn("login_partner RPC attempt error:", rpcErr);
        }

        // Direct table query check
        if (!partnerData) {
          const { data: directData, error: directError } = await supabase
            .from('partners')
            .select('*')
            .ilike('email', cleanEmail)
            .eq('password', password)
            .maybeSingle();

          if (directData && !directError) {
            partnerData = directData;
          }
        }

        // If found in database, seamlessly sync into Supabase Auth
        if (partnerData) {
          try {
            await supabase.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: {
                  role: 'partner',
                  restaurant_name: partnerData.restaurant_name,
                  owner_name: partnerData.owner_name
                }
              }
            });
          } catch (syncErr) {
            console.warn("Supabase Auth sync note:", syncErr);
          }
        }
      }

      // If still not authenticated, fail
      if (!partnerData) {
        throw new Error('Invalid email or password.');
      }

      // Clear lockouts & attempts
      sessionStorage.removeItem(ATTEMPTS_KEY);
      sessionStorage.removeItem(LOCKOUT_KEY);
      setAttempts(0);

      // Save partner session in localStorage
      localStorage.setItem('partnerUser', JSON.stringify(partnerData));

      if (onAuthenticated) {
        onAuthenticated(partnerData);
      } else {
        if (!partnerData.opening_time) {
          navigate('/partner/setup-profile');
        } else {
          navigate('/partner/dashboard');
        }
      }
    } catch (err) {
      console.error('Partner Sign In Error:', err);
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
        setErrorMsg(err.message || 'Invalid email or password.');
      }

      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Restaurant Partner Sign In | Fuudr Program</title>
        <meta name="description" content="Sign in to your Fuudr restaurant partner dashboard to manage orders, menus, accompaniments, and live operations." />
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pa-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #080809;
        }

        .pa-left {
          display: none;
          position: relative;
          width: 55%;
          overflow: hidden;
          margin: 16px;
          border-radius: 28px;
        }
        @media (min-width: 860px) { .pa-left { display: block; } }

        .pa-left-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center;
          filter: brightness(0.55) saturate(0.9);
        }

        .pa-left-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            135deg,
            rgba(8,8,9,0.45) 0%,
            rgba(8,8,9,0.15) 50%,
            rgba(8,8,9,0.6) 100%
          );
        }

        .pa-left-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            rgba(8,8,9,0.92) 0%,
            rgba(8,8,9,0.3) 40%,
            transparent 70%
          );
        }

        .pa-left-content {
          position: absolute; inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 40px;
        }

        .pa-left-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .pa-left-logo {
          width: 34px; height: 34px;
          border-radius: 9px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .pa-left-logo img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .pa-left-brand-name {
          font-size: 16px; font-weight: 700;
          color: #fff; letter-spacing: -0.2px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        .pa-left-tag {
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
        .pa-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f97316;
          animation: pa-blink 1.6s ease-in-out infinite;
        }
        .pa-left-heading {
          font-size: 32px; font-weight: 800;
          color: #fff; letter-spacing: -0.8px;
          line-height: 1.18;
          margin-bottom: 12px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .pa-left-heading span { color: #fb923c; }
        .pa-left-sub {
          font-size: 13px; color: rgba(255,255,255,0.5);
          font-weight: 400; line-height: 1.65;
          max-width: 340px;
        }

        .pa-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: #080809;
          position: relative;
        }
        .pa-right::before {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        .pa-form-wrap {
          width: 100%; max-width: 360px;
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                      transform 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .pa-form-wrap.mounted { opacity: 1; transform: translateY(0); }
        .pa-form-wrap.shake { animation: pa-shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97); }

        .pa-eyebrow {
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.8px; text-transform: uppercase;
          color: #f97316; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .pa-title {
          font-size: 26px; font-weight: 800;
          color: #fff; letter-spacing: -0.6px; margin-bottom: 6px;
        }
        .pa-subtitle {
          font-size: 13px; color: rgba(255,255,255,0.35);
          font-weight: 400; margin-bottom: 24px; line-height: 1.5;
        }

        .pa-field-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.9px; text-transform: uppercase;
          color: rgba(255,255,255,0.4); margin-bottom: 8px;
          display: block;
        }
        .pa-input-wrap { position: relative; margin-bottom: 16px; }
        .pa-input {
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
        .pa-input::placeholder { color: rgba(255,255,255,0.2); }
        .pa-input:focus {
          border-color: rgba(249,115,22,0.5);
          background: rgba(255,255,255,0.06);
        }
        .pa-input.err {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.05);
        }
        .pa-toggle {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); padding: 4px;
          display: flex; align-items: center;
          transition: color 0.15s;
          font-family: inherit;
        }
        .pa-toggle:hover { color: rgba(255,255,255,0.7); }
        .pa-error {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12px; font-weight: 500;
          color: #f87171; margin-bottom: 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          padding: 10px 12px;
          border-radius: 10px;
          line-height: 1.4;
        }
        .pa-btn {
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
        .pa-btn:hover:not(:disabled) {
          background: #ea6d10;
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(249,115,22,0.36);
        }
        .pa-btn:active:not(:disabled) { transform: translateY(0); }
        .pa-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .pa-signup-prompt {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }
        .pa-signup-link {
          color: #f97316;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
          transition: color 0.15s;
        }
        .pa-signup-link:hover {
          color: #fb923c;
          text-decoration: underline;
        }

        .pa-footer {
          display: flex; align-items: center; gap: 10px;
          margin-top: 28px;
        }
        .pa-footer-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .pa-footer-text {
          font-size: 11px; color: rgba(255,255,255,0.18);
          font-weight: 500; white-space: nowrap;
        }

        @keyframes pa-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-10px); }
          30%      { transform: translateX(10px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          80%      { transform: translateX(-3px); }
        }
        @keyframes pa-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="pa-root">

        {/* ── LEFT: Food image panel ── */}
        <div className="pa-left">
          <img src={FOOD_IMAGES[imgIndex]} alt="Restaurant Partner" className="pa-left-img" />
          <div className="pa-left-overlay" />
          <div className="pa-left-gradient" />

          <div className="pa-left-content">
            <div className="pa-left-brand">
              <div className="pa-left-logo">
                <img src="/favicon.png" alt="Fuudr" />
              </div>
              <span className="pa-left-brand-name">Fuudr Partner</span>
            </div>

            <div>
              <div className="pa-left-tag">
                <span className="pa-live-dot" />
                Restaurant Partner Portal
              </div>
              <h2 className="pa-left-heading">
                Protected <span>Partner</span> Portal
              </h2>
              <p className="pa-left-sub">
                Manage your restaurant menu, orders, accompaniments, and live operations in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="pa-right">
          <div className={`pa-form-wrap${mounted ? ' mounted' : ''}${shake ? ' shake' : ''}`}>

            <p className="pa-eyebrow">
              <ShieldCheck size={14} />
              Fuudr Partner Security
            </p>
            <h1 className="pa-title">Partner Sign In</h1>
            <p className="pa-subtitle">Enter your registered email and password to access your restaurant dashboard.</p>

            <form onSubmit={handleSubmit}>
              <label className="pa-field-label">Restaurant Email Address</label>
              <div className="pa-input-wrap">
                <input
                  className={`pa-input${errorMsg && !lockedOut ? ' err' : ''}`}
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="restaurant@example.com"
                  disabled={lockedOut || loading}
                  required
                />
              </div>

              <label className="pa-field-label">Password</label>
              <div className="pa-input-wrap">
                <input
                  className={`pa-input${errorMsg ? ' err' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                  placeholder={lockedOut ? 'Access locked' : '••••••••••••'}
                  disabled={lockedOut || loading}
                  required
                />
                <button 
                  type="button" 
                  className="pa-toggle" 
                  onClick={() => setShow(s => !s)} 
                  tabIndex={-1} 
                  disabled={lockedOut || loading}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {lockedOut && (
                <div className="pa-error">
                  <Lock size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Too many failed attempts. Try again in <strong>{formatCountdown(countdown)}</strong>
                  </span>
                </div>
              )}

              {errorMsg && !lockedOut && (
                <div className="pa-error">
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

              <button type="submit" className="pa-btn" disabled={loading || !email || !password || lockedOut}>
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin 0.75s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"/>
                      <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Signing In...
                  </>
                ) : lockedOut ? (
                  <>Locked — {formatCountdown(countdown)}</>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="pa-signup-prompt">
              Don't have a partner account?
              <Link to="/partner/signup" className="pa-signup-link">
                Register Restaurant
              </Link>
            </div>

            <div className="pa-footer">
              <div className="pa-footer-line" />
              <span className="pa-footer-text">© 2025 Fuudr Inc. · Partner Portal</span>
              <div className="pa-footer-line" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export function PartnerRoute({ children }) {
  const [partnerUser, setPartnerUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        // 1. Check active Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        let localUser = null;
        try {
          const stored = localStorage.getItem('partnerUser');
          if (stored) localUser = JSON.parse(stored);
        } catch {
          // Ignore
        }

        if (session?.user) {
          if (localUser && localUser.email?.toLowerCase() === session.user.email?.toLowerCase()) {
            if (isSubscribed) setPartnerUser(localUser);
          } else {
            // Fetch partner record for the active session user
            const { data: profile } = await supabase
              .from('partners')
              .select('*')
              .ilike('email', session.user.email)
              .maybeSingle();

            if (profile) {
              localStorage.setItem('partnerUser', JSON.stringify(profile));
              if (isSubscribed) setPartnerUser(profile);
            } else if (localUser) {
              if (isSubscribed) setPartnerUser(localUser);
            }
          }
        } else if (localUser) {
          // If stored locally, allow access
          if (isSubscribed) setPartnerUser(localUser);
        }
      } catch (err) {
        console.warn('Error verifying partner session:', err);
      } finally {
        if (isSubscribed) setCheckingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('partners')
          .select('*')
          .ilike('email', session.user.email)
          .maybeSingle();

        if (profile) {
          localStorage.setItem('partnerUser', JSON.stringify(profile));
          setPartnerUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('partnerUser');
        setPartnerUser(null);
      }
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080809] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Verifying Partner Session...</span>
        </div>
      </div>
    );
  }

  if (partnerUser) {
    return children;
  }

  return <PartnerAuthForm onAuthenticated={(user) => setPartnerUser(user)} />;
}
