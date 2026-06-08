import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './index.css';

/* ── Reel data ── */
const PIZZA_REELS = [
  { video: '/pizza1.mp4', restaurant: 'Napoli Kitchen', dish: 'Margherita Pizza', distance: '0.8 km away', handle: '@napolikitchen' },
  { video: '/pizza2.mp4', restaurant: 'Pizza House', dish: 'Pepperoni Special', distance: '1.2 km away', handle: '@pizzahouse_in' },
];
const BURGER_REELS = [
  { video: '/burger1.mp4', restaurant: 'Burger Boss & Fries', dish: 'Smash Double Cheeseburger', distance: '1.5 km away', handle: '@burgerboss_in' },
  { video: '/burger2.mp4', restaurant: 'The Patty Lab', dish: 'Double Smash Burger', distance: '0.9 km away', handle: '@pattylab_in' },
];
const REEL_SETS = [PIZZA_REELS, BURGER_REELS];
const SEGMENTS = 2;
const SEGMENT_DURATION_DEFAULT = 7000;
const SEGMENT_DURATION_BURGER2 = 10000;

/* ── Icons ── */
const IconSave   = () => <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IconShare  = () => <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/></svg>;
const IconReview = () => <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconSound  = () => <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const IconCart   = () => <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconMenu   = () => <svg viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;

function ReelInfo({ r }) {
  return (
    <>
      <div className="phone-side-actions">
        {[
          { icon: <IconSave/>, label: 'Save' },
          { icon: <IconShare/>, label: 'Share' },
          { icon: <IconReview/>, label: 'Reviews' },
          { icon: <IconSound/>, label: 'Sound' },
        ].map(({ icon, label }) => (
          <div key={label} className="phone-action">
            <div className="phone-action-icon">{icon}</div>
            <span className="phone-action-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="phone-bottom-info">
        <p className="phone-restaurant">{r.restaurant}</p>
        <p className="phone-dish-name">{r.dish}</p>
        <div className="phone-distance"><span>{r.distance}</span></div>
        <p className="phone-handle">{r.handle}</p>
      </div>
      <div className="phone-ctas">
        <button className="phone-cart-btn"><IconCart/>Add to Cart</button>
        <button className="phone-menu-btn"><IconMenu/>Menu</button>
      </div>
    </>
  );
}

function PhoneCard({ bobClass = 'bobbing-1' }) {
  const [setIdx, setSetIdx]     = useState(0);
  const [seg, setSeg]           = useState(0);
  const [progress, setProgress] = useState(0);
  const [fading, setFading]     = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [showSwipe, setShowSwipe] = useState(false);
  const [swipeKey, setSwipeKey]   = useState(0);
  const [preloadNext, setPreloadNext] = useState(false);

  const segRef      = useRef(0);
  const setIdxRef   = useRef(0);
  const fadingRef   = useRef(false);
  const showSwipeRef    = useRef(false);
  const swipeShownOnce  = useRef(false);
  const timerRef        = useRef(null);
  const segStartRef     = useRef(Date.now());

  const getDuration = (si, sg) =>
    si === 1 && sg === 1 ? SEGMENT_DURATION_BURGER2 : SEGMENT_DURATION_DEFAULT;

  useEffect(() => {
    segStartRef.current = Date.now();
    const iv = setInterval(() => {
      if (fadingRef.current) return;
      const duration = getDuration(setIdxRef.current, segRef.current);
      const elapsed  = Date.now() - segStartRef.current;
      const next     = Math.min((elapsed / duration) * 100, 100);
      if (next >= 90 && segRef.current === 1) setPreloadNext(true);
      const trigger = setIdxRef.current === 0 ? 65 : 75;
      if (segRef.current === 1 && next >= trigger && !showSwipeRef.current && !swipeShownOnce.current) {
        showSwipeRef.current  = true;
        swipeShownOnce.current = true;
        setSwipeKey(k => k + 1);
        setShowSwipe(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { setShowSwipe(false); showSwipeRef.current = false; }, 2000);
      }
      if (next >= 100) {
        setProgress(100);
        fadingRef.current = true; setFading(true);
        setTimeout(() => {
          if (segRef.current === 1) {
            setFading(false); setScrolling(true);
            setTimeout(() => {
              const nextSet = (setIdxRef.current + 1) % REEL_SETS.length;
              setIdxRef.current = nextSet; setSetIdx(nextSet);
              segRef.current = 0; setSeg(0); setProgress(0);
              setScrolling(false); setPreloadNext(false);
              fadingRef.current = false; segStartRef.current = Date.now();
            }, 550);
          } else {
            segRef.current = 1; setSeg(1); setProgress(0);
            fadingRef.current = false; setFading(false);
            segStartRef.current = Date.now();
          }
        }, 350);
      } else {
        setProgress(next);
      }
    }, 200);
    return () => { clearInterval(iv); clearTimeout(timerRef.current); };
  }, []);

  const reels   = REEL_SETS[setIdx];
  const nextSet = REEL_SETS[(setIdx + 1) % REEL_SETS.length];
  const r = reels[seg];

  return (
    <div className={`reveal ${bobClass}`}>
      <div className="phone-shell">
        <div className="phone-screen" style={{ overflow: 'hidden' }}>
          <div
            className="reel-scroll-container"
            style={{
              transform: scrolling ? 'translateY(-50%)' : 'translateY(0)',
              transition: scrolling ? 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
            }}
          >
            <div className="reel-slide">
              <video key={`${setIdx}-${seg}`} src={r.video} autoPlay loop muted playsInline preload="auto"
                className={`phone-reel-img ${fading ? 'fade-out' : 'fade-in'}`}/>
              <div className="phone-reel-overlay"/>
              <ReelInfo r={r}/>
            </div>
            <div className="reel-slide">
              {preloadNext && (
                <>
                  <video key={`next-${setIdx}`} src={nextSet[0].video} autoPlay loop muted playsInline preload="auto" className="phone-reel-img fade-in"/>
                  <div className="phone-reel-overlay"/>
                  <ReelInfo r={nextSet[0]}/>
                </>
              )}
            </div>
          </div>
          <div className="phone-progress-bars">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <div key={i} className="phone-progress-seg">
                <div className="phone-progress-fill" style={{
                  width: i < seg ? '100%' : i === seg ? `${progress}%` : '0%',
                }}/>
              </div>
            ))}
          </div>
          {showSwipe && (
            <video key={swipeKey} src="/swipeup_nobg.webm" autoPlay muted playsInline
              onTimeUpdate={e => { if (e.target.currentTime >= 3) { e.target.pause(); setShowSwipe(false); showSwipeRef.current = false; } }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 30, pointerEvents: 'none', opacity: 0.75 }}
            />
          )}
        </div>
        <div className="phone-home-bar"/>
        <div className="phone-btn phone-vol1"/>
        <div className="phone-btn phone-vol2"/>
        <div className="phone-btn phone-power"/>
      </div>
    </div>
  );
}

/* ── Hooks ── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }),
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ══════════════════
   NAVBAR
══════════════════ */
function Navbar({ onJoinClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="nav-wrapper">
      <a href="#" className="nav-logo">
        <img src="/favicon.png" alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
        Fuud<span>r</span>
      </a>

      <div className="nav-links">
      </div>

      <button className="nav-cta-btn" onClick={onJoinClick}>
        Join Waitlist
      </button>

      <button
        className={`nav-mobile-toggle ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Menu"
      >
        <span/><span/><span/>
      </button>

      <div className={`nav-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <a href="#" onClick={() => { setMobileOpen(false); onJoinClick(); }}>Join Waitlist →</a>
      </div>
    </div>
  );
}

/* ══════════════════
   FOOTER
══════════════════ */
function Footer() {
  const [footerEmail, setFooterEmail] = useState('');
  const [footerStatus, setFooterStatus] = useState('');

  const sendFooterEmail = async (e) => {
    e.preventDefault();
    setFooterStatus('Sending...');
    try {
      const { error } = await supabase.from('waitlist').insert([{ email: footerEmail }]);
      if (error) {
        if (error.code === '23505') {
          setFooterStatus('Already joined!');
        } else {
          throw error;
        }
      } else {
        setFooterStatus('Joined!');
        setFooterEmail('');
      }
      setTimeout(() => setFooterStatus(''), 3000);
    } catch {
      setFooterStatus('Error — Retry');
      setTimeout(() => setFooterStatus(''), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Brand col */}
        <div className="footer-col">
          <div className="footer-brand-name">Fuud<span>r</span></div>
          <p className="footer-brand-desc">
            Short-form food reels that let you see it, crave it, and order it — all in one place.
          </p>
          <form className="footer-waitlist-form" onSubmit={sendFooterEmail}>
            <input
              type="email" required
              placeholder="Your email"
              className="footer-waitlist-input"
              value={footerEmail}
              onChange={e => setFooterEmail(e.target.value)}
            />
            <button type="submit" className="footer-waitlist-btn" disabled={footerStatus === 'Sending...'}>
              {footerStatus || 'Join Waitlist'}
            </button>
          </form>
        </div>

        {/* Company */}
        <div className="footer-col">
          <div className="footer-col-label">Company</div>
          <div className="footer-col-links">
            <a href="mailto:solvers.real@gmail.com" className="footer-col-link">Contact</a>
          </div>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <div className="footer-col-label">Legal</div>
          <div className="footer-col-links">
            <a href="#/terms" className="footer-col-link">Terms of Service</a>
            <a href="#/privacy" className="footer-col-link">Privacy Policy</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copy">© 2026 Fuudr. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* ══════════════════
   LANDING PAGE
══════════════════ */
function Landing() {
  const formRef = useRef();
  const formElRef = useRef();
  const [status, setStatus] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useReveal();

  /* ── Hero flowing lines canvas ── */
  useEffect(() => {
    const canvas = document.getElementById('heroLinesCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      const section = canvas.parentElement;
      canvas.width  = section ? section.offsetWidth : window.innerWidth;
      canvas.height = section ? section.offsetHeight : window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const lines = Array.from({ length: 9 }, (_, i) => ({
      seed:     i * 1.8,
      speed:    0.00012 + i * 0.00003,
      amp:      45 + i * 18,
      yBase:    0.08 + i * 0.10,
      segments: 160,
    }));

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lines.forEach((l, idx) => {
        const points = [];
        for (let s = 0; s <= l.segments; s++) {
          const x = (s / l.segments) * canvas.width;
          const y = l.yBase * canvas.height
            + Math.sin(s * 0.06 + t * l.speed * 60 + l.seed) * l.amp
            + Math.sin(s * 0.02 + t * l.speed * 30 + l.seed * 2) * (l.amp * 0.4);
          points.push({ x, y });
        }

        // draw line segment by segment, fading alpha in exclusion zones
        for (let s = 0; s < points.length - 1; s++) {
          const { x, y } = points[s];
          const halfW = canvas.width * 0.5;

          // exclusion zones on left side (as fraction of canvas)
          // headline area: top 55% of left half
          // form area: 62%-82% vertically, left 55% horizontally
          const inHeadline = x < halfW * 1.05 && y / canvas.height < 0.58;
          const inForm     = x < halfW * 0.95 && y / canvas.height > 0.60 && y / canvas.height < 0.88;
          const inLeftSide = x < halfW;

          let alpha;
          if (inLeftSide || inHeadline || inForm) {
            alpha = 0;
          } else {
            alpha = 0.08 + (idx % 2) * 0.05;
          }

          ctx.beginPath();
          ctx.strokeStyle = `rgba(26,20,16,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.moveTo(points[s].x, points[s].y);
          ctx.lineTo(points[s + 1].x, points[s + 1].y); 
          ctx.stroke();
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const fn = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) setScrollProgress((window.scrollY / total) * 100);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollToForm = (e) => {
    if (e) e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const input = formRef.current?.querySelector('input');
      if (input) { input.focus(); }
    }, 600);
  };

  const sendEmail = async e => {
    e.preventDefault();
    const email = formElRef.current.user_email.value.trim();
    if (!email) return;
    setStatus('Sending...');
    try {
      const { error } = await supabase.from('waitlist').insert([{ email }]);
      if (error) {
        if (error.code === '23505') {
          setStatus('Already joined!');
        } else {
          setStatus('Error — Retry');
        }
      } else {
        setStatus('Joined!');
        setShowPopup(true);
        formElRef.current.reset();
      }
    } catch (err) {
      console.error(err);
      setStatus('Error — Retry');
    } finally {
      setTimeout(() => setStatus(''), 3500);
    }
  };

  return (
    <>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }}/>
      <Navbar onJoinClick={scrollToForm}/>

      <main>

        {/* ── HERO ── */}
        <section className="hero-section">
          <canvas className="hero-lines-canvas" id="heroLinesCanvas"/>
          <div className="hero-left">
            <div className="hero-eyebrow reveal"><strong>Coming Soon · Food Discovery App</strong></div>

            <h1 className="hero-headline reveal" style={{ transitionDelay: '100ms' }}>
              Food you<br/>can almost<br/><em>smell.</em>
            </h1>

            <p className="hero-sub reveal" style={{ transitionDelay: '200ms' }}>
              Skip boring menus. Watch short food reels and order your favourite meals instantly, from restaurants near you.
            </p>

            <div className="reveal" style={{ transitionDelay: '300ms' }} ref={formRef}>
              <form onSubmit={sendEmail} ref={formElRef} className="waitlist-form">
                <input
                  name="user_email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="waitlist-input"
                />
                <button type="submit" className="waitlist-btn" disabled={status === 'Sending...'}>
                  {status || 'Join Waitlist'}
                </button>
              </form>
              <p className="waitlist-note">Join 2,400+ foodies waiting for launch.</p>
            </div>

            {/* Floating food images */}
            <div className="hero-food-floaters">
              <img src="/Pizza.png" alt="Pizza" className="hf-img hf-1" />
              <img src="/Burger.png" alt="Burger" className="hf-img hf-2" />
              <img src="/Panner.png" alt="Paneer" className="hf-img hf-3" />
              <img src="/Chole.png" alt="Chole" className="hf-img hf-4" />
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-right-bg"/>
            <PhoneCard bobClass="bobbing-1"/>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="marquee-strip">
          <div className="marquee-track">
            {[...Array(3)].map((_, i) =>
              ['See it', 'Crave it', 'Order it', 'Food Reels', 'Nearby Restaurants', 'Coming Soon', 'Join Waitlist', 'Discover Food'].map(word => (
                <span key={`${i}-${word}`} className="marquee-item">
                  <span className="marquee-dot"/>
                  {word}
                </span>
              ))
            )}
          </div>
        </div>

        <section className="quote-section">
          <p className="quote-text reveal">
            Food is not just fuel. It's a <em>feeling</em> and Fuudr is built to make every meal feel worth looking forward to.
          </p>
          <p className="quote-attr reveal" style={{ transitionDelay: '200ms' }}>
            <svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '360px', display: 'block', margin: '0 auto' }}>
              <defs>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}</style>
                <mask id="writeMask">
                  <rect id="writeReveal" x="0" y="0" width="0" height="100" fill="white">
                    <animate attributeName="width" from="0" to="400" dur="2.2s" begin="0.6s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
                  </rect>
                </mask>
              </defs>
              <g mask="url(#writeMask)">
                <text x="50%" y="58" textAnchor="middle" fontFamily="'Dancing Script', cursive" fontSize="48" fontWeight="700" fill="rgba(245,240,232,0.82)" letterSpacing="1">the fuudr team</text>
              </g>
            </svg>
          </p>
        </section>

      </main>

      <Footer/>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-card" onClick={e => e.stopPropagation()}>
            <div className="popup-icon">🎉</div>
            <h2 className="popup-title">You're on the list!</h2>
            <p className="popup-desc">
              Thanks for joining the Fuudr waitlist. We'll notify you the moment we launch.
            </p>
            <button className="popup-btn" onClick={() => setShowPopup(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════
   APP ROOT
══════════════════ */
function App() {
  const [hash, setHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    const fn = () => setHash(window.location.hash);
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  if (hash === '#/terms') return (
    <div className="coming-soon-page">
      <a href="#/" className="cs-logo">Fuud<span>r</span></a>
      <div className="cs-tag">Terms of Service</div>
      <h1 className="cs-title">Coming<br/><em>Soon</em></h1>
      <p className="cs-sub">We're working on this page. Check back shortly.</p>
      <a href="#/" className="cs-btn">← Back to Home</a>
    </div>
  );
  if (hash === '#/privacy') return (
    <div className="coming-soon-page">
      <a href="#/" className="cs-logo">Fuud<span>r</span></a>
      <div className="cs-tag">Privacy Policy</div>
      <h1 className="cs-title">Coming<br/><em>Soon</em></h1>
      <p className="cs-sub">We're working on this page. Check back shortly.</p>
      <a href="#/" className="cs-btn">← Back to Home</a>
    </div>
  );
  return <Landing/>;
}

export default App;
