import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const SESSION_KEY = 'fuudr_super_admin_auth';

const FOOD_IMAGES = [
  'https://images.pexels.com/photos/3850349/pexels-photo-3850349.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/5951559/pexels-photo-5951559.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/14622417/pexels-photo-14622417.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/12084254/pexels-photo-12084254.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export function SuperAdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [show, setShow]                       = useState(false);
  const [error, setError]                     = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [shake, setShake]                     = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [imgIndex]                            = useState(() => Math.floor(Math.random() * FOOD_IMAGES.length));

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setIsAuthenticated(true);
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'super_admin_password')
      .single();
    setLoading(false);
    if (!dbError && data?.value && password === data.value) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

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
          width: 100%; max-width: 340px;
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
          color: #f97316; margin-bottom: 10px;
        }
        .sa-title {
          font-size: 26px; font-weight: 800;
          color: #fff; letter-spacing: -0.6px; margin-bottom: 6px;
        }
        .sa-subtitle {
          font-size: 13px; color: rgba(255,255,255,0.3);
          font-weight: 400; margin-bottom: 32px; line-height: 1.6;
        }
        .sa-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-bottom: 28px;
        }
        .sa-field-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.9px; text-transform: uppercase;
          color: rgba(255,255,255,0.28); margin-bottom: 8px;
        }
        .sa-input-wrap { position: relative; margin-bottom: 10px; }
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
        .sa-input::placeholder { color: rgba(255,255,255,0.16); }
        .sa-input:focus {
          border-color: rgba(249,115,22,0.4);
          background: rgba(255,255,255,0.06);
        }
        .sa-input.err {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.04);
        }
        .sa-toggle {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.2); padding: 4px;
          display: flex; align-items: center;
          transition: color 0.15s;
          font-family: inherit;
        }
        .sa-toggle:hover { color: rgba(255,255,255,0.5); }
        .sa-error {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500;
          color: #f87171; margin-bottom: 14px;
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
          margin-top: 6px;
        }
        .sa-btn:hover:not(:disabled) {
          background: #ea6d10;
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(249,115,22,0.36);
        }
        .sa-btn:active:not(:disabled) { transform: translateY(0); }
        .sa-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sa-footer {
          display: flex; align-items: center; gap: 10px;
          margin-top: 28px;
        }
        .sa-footer-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .sa-footer-text {
          font-size: 11px; color: rgba(255,255,255,0.13);
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
            {/* Brand — real favicon */}
            <div className="sa-left-brand">
              <div className="sa-left-logo">
                <img src="/favicon.png" alt="Fuudr" />
              </div>
              <span className="sa-left-brand-name">Fuudr</span>
            </div>

            {/* Bottom */}
            <div>
              <div className="sa-left-tag">
                <span className="sa-live-dot" />
                Live Orders
              </div>
              <h2 className="sa-left-heading">
                Every order,<br />tracked in <span>real‑time</span>
              </h2>
              <p className="sa-left-sub">
                Full visibility into orders, deliveries, and restaurant operations — from one dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="sa-right">
          <div className={`sa-form-wrap${mounted ? ' mounted' : ''}${shake ? ' shake' : ''}`}>

            <p className="sa-eyebrow">Super Admin Portal</p>
            <h1 className="sa-title">Welcome back</h1>
            <p className="sa-subtitle">Sign in to manage Fuudr's orders and deliveries.</p>

            <div className="sa-divider" />

            <form onSubmit={handleSubmit}>
              <p className="sa-field-label">Password</p>
              <div className="sa-input-wrap">
                <input
                  className={`sa-input${error ? ' err' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  placeholder="Enter your password"
                  autoFocus
                />
                <button type="button" className="sa-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {error && (
                <p className="sa-error">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2"/>
                    <path d="M12 8v5M12 16h.01" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Incorrect password. Please try again.
                </p>
              )}

              <button type="submit" className="sa-btn" disabled={loading || !password}>
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      style={{ animation: 'spin 0.75s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"/>
                      <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="sa-footer">
              <div className="sa-footer-line" />
              <span className="sa-footer-text">© 2025 Fuudr · fuudr.com</span>
              <div className="sa-footer-line" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
