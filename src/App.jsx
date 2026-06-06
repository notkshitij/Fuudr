import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './index.css';
import Terms from './Terms';
import Privacy from './Privacy';

const PIZZA_REELS = [
  { video: '/pizza1.mp4', restaurant: 'Napoli Kitchen',  dish: 'Margherita Pizza',       distance: '0.8 km away', handle: '@napolikitchen' },
  { video: '/pizza2.mp4', restaurant: 'Pizza House',     dish: 'Pepperoni Special',       distance: '1.2 km away', handle: '@pizzahouse_in' },
];
const BURGER_REELS = [
  { video: '/burger1.mp4', restaurant: 'Burger Boss & Fries', dish: 'Smash Double Cheeseburger', distance: '1.5 km away', handle: '@burgerboss_in' },
  { video: '/burger2.mp4', restaurant: 'The Patty Lab',       dish: 'Double Smash Burger',       distance: '0.9 km away', handle: '@pattylab_in' },
];
const REEL_SETS             = [PIZZA_REELS, BURGER_REELS];
const SEGMENTS              = 2;
const SEGMENT_DURATION_DEFAULT = 7000;
const SEGMENT_DURATION_BURGER2 = 10000;

const IconSave   = () => <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IconShare  = () => <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/></svg>;
const IconReview = () => <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconSound  = () => <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const IconCart   = () => <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconMenu   = () => <svg viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
const IconBattery = ({ level = 50 }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ color: 'white' }}>
    <rect x="2" y="7" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor"/>
    <rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor" style={{ opacity: level / 100 }}/>
  </svg>
);

function ReelInfo({ r }) {
  return (
    <>
      <div className="phone-side-actions">
        {[
          { icon: <IconSave />,   label: 'Save' },
          { icon: <IconShare />,  label: 'Share' },
          { icon: <IconReview />, label: 'Reviews' },
          { icon: <IconSound />,  label: 'Sound' },
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
        <div className="phone-distance"><span>📍</span><span>{r.distance}</span></div>
        <p className="phone-handle">{r.handle}</p>
      </div>
      <div className="phone-ctas">
        <button className="phone-cart-btn"><IconCart />Add to Cart</button>
        <button className="phone-menu-btn"><IconMenu />Menu</button>
      </div>
    </>
  );
}

function PhoneCard({ rotate = '0deg', bobClass = 'bobbing-1', revealDelay = '0ms' }) {
  const [setIdx,    setSetIdx]    = useState(0);
  const [seg,       setSeg]       = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [fading,    setFading]    = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [showSwipe, setShowSwipe] = useState(false);
  const [swipeKey,  setSwipeKey]  = useState(0);
  // Only render the next slide when we actually need to scroll
  const [preloadNext, setPreloadNext] = useState(false);

  const segRef       = useRef(0);
  const setIdxRef    = useRef(0);
  const fadingRef    = useRef(false);
  const showSwipeRef = useRef(false);
  const swipeShownOnce = useRef(false);
  const timerRef     = useRef(null);
  const segStartRef  = useRef(Date.now());

  const getDuration = (si, sg) =>
    si === 1 && sg === 1 ? SEGMENT_DURATION_BURGER2 : SEGMENT_DURATION_DEFAULT;

  useEffect(() => {
    segStartRef.current = Date.now();

    // Use 200ms interval instead of 50ms — much lighter on mobile
    const iv = setInterval(() => {
      if (fadingRef.current) return;

      const duration = getDuration(setIdxRef.current, segRef.current);
      const elapsed  = Date.now() - segStartRef.current;
      const next     = Math.min((elapsed / duration) * 100, 100);

      // Preload next slide only when we're close (90%)
      if (next >= 90 && segRef.current === 1) setPreloadNext(true);

      // Show hand at 65% pizza / 75% burger - only once
      const trigger = setIdxRef.current === 0 ? 65 : 75;
      if (segRef.current === 1 && next >= trigger && !showSwipeRef.current && !swipeShownOnce.current) {
        showSwipeRef.current = true;
        swipeShownOnce.current = true;
        setSwipeKey(k => k + 1);
        setShowSwipe(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowSwipe(false);
          showSwipeRef.current = false;
        }, 2000);
      }

      if (next >= 100) {
        setProgress(100);
        fadingRef.current = true;
        setFading(true);

        setTimeout(() => {
          const doneSeg = segRef.current;
          if (doneSeg === 1) {
            setFading(false);
            setScrolling(true);
            setTimeout(() => {
              const nextSet = (setIdxRef.current + 1) % REEL_SETS.length;
              setIdxRef.current = nextSet;
              setSetIdx(nextSet);
              segRef.current = 0;
              setSeg(0);
              setProgress(0);
              setScrolling(false);
              setPreloadNext(false);
              fadingRef.current = false;
              segStartRef.current = Date.now();
            }, 550);
          } else {
            segRef.current = 1;
            setSeg(1);
            setProgress(0);
            fadingRef.current = false;
            setFading(false);
            segStartRef.current = Date.now();
          }
        }, 350);
      } else {
        setProgress(next);
      }
    }, 200); // 200ms — plenty smooth, 4× lighter than 50ms

    return () => { clearInterval(iv); clearTimeout(timerRef.current); };
  }, []);

  const reels   = REEL_SETS[setIdx];
  const nextSet = REEL_SETS[(setIdx + 1) % REEL_SETS.length];
  const r       = reels[seg];

  return (
    <div className={`reveal ${bobClass}`} style={{ transitionDelay: revealDelay }}>
      <div style={{ transform: `rotate(${rotate})` }}>
        <div className="phone-shell">
          <div className="phone-screen" style={{ overflow: 'hidden' }}>

            <div
              className="reel-scroll-container"
              style={{
                transform:  scrolling ? 'translateY(-50%)' : 'translateY(0)',
                transition: scrolling ? 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
              }}
            >
              {/* Current reel */}
              <div className="reel-slide">
                <video
                  key={`${setIdx}-${seg}`}
                  src={r.video}
                  autoPlay loop muted playsInline
                  className={`phone-reel-img ${fading ? 'fade-out' : 'fade-in'}`}
                />
                <div className="phone-reel-overlay" />
                <ReelInfo r={r} />
              </div>

              {/* Next reel — only rendered when preloadNext=true to save memory */}
              <div className="reel-slide">
                {preloadNext && (
                  <>
                    <video
                      key={`next-${setIdx}`}
                      src={nextSet[0].video}
                      autoPlay loop muted playsInline
                      className="phone-reel-img fade-in"
                    />
                    <div className="phone-reel-overlay" />
                    <ReelInfo r={nextSet[0]} />
                  </>
                )}
              </div>
            </div>

            {/* Status + progress bars — always on top */}
            <div className="phone-statusbar">
              <span className="phone-time">3:09</span>
              <div className="phone-status-icons">
                <span>5G</span><span>▐▐▐▐</span>
                <IconBattery level={19} />
              </div>
            </div>

            <div className="phone-progress-bars">
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <div key={i} className="phone-progress-seg">
                  <div className="phone-progress-fill" style={{
                    width: i < seg ? '100%' : i === seg ? `${progress}%` : '0%',
                  }} />
                </div>
              ))}
            </div>

            {/* Swipe hand */}
            {showSwipe && (
              <video
                key={swipeKey}
                src="/swipeup_nobg.webm"
                autoPlay muted playsInline
                onTimeUpdate={e => {
                  if (e.target.currentTime >= 3) {
                    e.target.pause();
                    setShowSwipe(false);
                    showSwipeRef.current = false;
                  }
                }}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  zIndex: 30, pointerEvents: 'none',
                  opacity: 0.75,
                }}
              />
            )}
          </div>

          <div className="phone-home-bar" />
          <div className="phone-btn phone-vol1" />
          <div className="phone-btn phone-vol2" />
          <div className="phone-btn phone-power" />
        </div>
      </div>
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
function useCursorGlow() {
  useEffect(() => {
    // Skip on touch devices — no cursor
    if (window.matchMedia('(hover: none)').matches) return;
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    const move  = e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; glow.style.opacity = '1'; };
    const leave = () => { glow.style.opacity = '0'; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseleave', leave); };
  }, []);
}
function useNavShrink() {
  useEffect(() => {
    const fn = () => {
      const nav = document.querySelector('nav');
      if (!nav) return;
      if (window.scrollY > 50) { nav.classList.add('py-2', 'scale-95'); nav.classList.remove('py-3'); }
      else { nav.classList.remove('py-2', 'scale-95'); nav.classList.add('py-3'); }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
}
function useMagnetic() {
  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia('(hover: none)').matches) return;
    const btns = document.querySelectorAll('.btn-fancy');
    const hs = [];
    btns.forEach(btn => {
      const m = e => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px,${(e.clientY - r.top - r.height / 2) * 0.2}px) scale(1.05)`; };
      const l = () => { btn.style.transform = ''; };
      btn.addEventListener('mousemove', m); btn.addEventListener('mouseleave', l);
      hs.push([btn, m, l]);
    });
    return () => hs.forEach(([b, m, l]) => { b.removeEventListener('mousemove', m); b.removeEventListener('mouseleave', l); });
  }, []);
}

const IMG_DINING = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop';

function Landing() {
  const form = useRef();
  const [status, setStatus] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  useReveal(); useCursorGlow(); useNavShrink(); useMagnetic();

  const sendEmail = async e => {
    e.preventDefault();
    setStatus('Sending...');
    const email = form.current.user_email.value;
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);
      
      if (error) throw error;
      
      setStatus('JOINED!');
      setShowPopup(true);
      e.target.reset();
      setTimeout(() => setStatus(''), 3500);
    } catch (error) {
      console.error('Error saving email:', error);
      setStatus('ERROR – RETRY');
      setTimeout(() => setStatus(''), 3500);
    }
  };

  const words = [
    { w: 'Food',   d: '0.1s', cls: '' },
    { w: 'you',    d: '0.2s', cls: '' },
    { w: 'can',    d: '0.3s', cls: '' },
    { w: 'almost', d: '0.5s', cls: 'text-primary italic' },
    { w: 'smell',  d: '0.7s', cls: '' },
  ];

  return (
    <>
      <div id="cursor-glow" />

      {/* Blobs — hidden on mobile to save GPU */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block" style={{ zIndex: -1 }}>
        <div className="floating-blob bg-primary w-[600px] h-[600px] -top-32 -left-32" />
        <div className="floating-blob bg-secondary-container w-[500px] h-[500px] top-1/2 -right-20" style={{ animationDelay: '-7s' }} />
        <div className="floating-blob bg-surface-container-highest w-[700px] h-[700px] -bottom-40 left-1/4" style={{ animationDelay: '-14s' }} />
      </div>

      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-[1280px] z-50">
        <nav className="bg-white/90 glass-nav rounded-full border border-secondary/10 shadow-[0_40px_40px_-15px_rgba(171,54,0,0.15)] flex justify-between items-center px-6 md:px-8 py-3 transition-all duration-500">
          <span className="font-display-xl text-headline-md text-primary italic" style={{ fontFamily: 'Bricolage Grotesque' }}>Fuudr</span>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-label-bold text-label-bold uppercase tracking-wider text-primary border-b-2 border-primary pb-1" href="#">Discover</a>
            <a className="font-label-bold text-label-bold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors" href="#features">How it Works</a>
          </div>
          <a href="#hero" className=" text-background  px-6 py-2.5"></a>
        </nav>
      </header>

      <main className="relative">
        <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
          <div className="w-full max-w-[1280px] mx-auto px-5 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div className="z-10 space-y-8 text-center lg:text-left">
              <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-label-bold text-label-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Coming Soon
              </div>

              <h1 className="font-display-xl text-display-xl-mobile md:text-display-xl text-on-background leading-[1.0]" style={{ fontFamily: 'Bricolage Grotesque' }}>
                {words.map(({ w, d, cls }, i) => (
                  <React.Fragment key={i}>
                    <span className={`word-bounce ${cls}`} style={{ animationDelay: d }}>{w}</span>{' '}
                  </React.Fragment>
                ))}
              </h1>

              <p className="reveal font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto lg:mx-0" style={{ transitionDelay: '400ms' }}>
                Skip the boring menus. Watch tasty food reels and order your favourite meals instantly.
              </p>

              <div className="reveal w-full max-w-xl mx-auto lg:mx-0" style={{ transitionDelay: '600ms' }}>
                <form ref={form} onSubmit={sendEmail} className="bg-white p-2 rounded-full flex items-center gap-2 shadow-[0_20px_50px_rgba(43,18,8,0.1)] border border-outline/10">
                  <input name="user_email" className="flex-1 bg-transparent border-none focus:ring-0 px-6 font-body-md text-on-surface placeholder:text-outline-variant outline-none" placeholder="Enter your email address" required type="email" />
                  <button className="btn-fancy bg-on-background text-background font-label-bold text-label-bold px-8 py-4 rounded-full whitespace-nowrap" type="submit" disabled={status === 'Sending...'}>
                    {status || 'JOIN WAITLIST'}
                  </button>
                </form>
                <p className="mt-4 text-xs text-outline" style={{ fontFamily: 'Plus Jakarta Sans' }}>Join 2,400+ foodies waiting for the launch.</p>
              </div>

              <div className="reveal" style={{ transitionDelay: '800ms' }}>
                <a href="#features" className="btn-fancy inline-block font-label-bold text-label-bold text-primary uppercase tracking-widest border-2 border-primary/30 hover:border-primary/60 px-8 py-3 rounded-full transition-all">
                  How It Works
                </a>
              </div>
            </div>

            <div className="hidden lg:flex justify-center items-center h-[680px]">
              <PhoneCard rotate="-4deg" bobClass="bobbing-1" revealDelay="200ms" />
            </div>
            <div className="lg:hidden flex justify-center mt-6">
              <PhoneCard rotate="0deg" bobClass="bobbing-1" revealDelay="200ms" />
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 reveal z-10" style={{ transitionDelay: '1000ms' }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Psst... This Way</span>
            <span className="material-symbols-outlined animate-bounce">expand_more</span>
          </div>
        </section>

        <section id="features" className="max-w-[1280px] mx-auto px-5 py-section-gap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gridAutoRows: '250px' }}>
            <div className="md:col-span-2 md:row-span-2 bg-surface-container-low rounded-lg p-10 flex flex-col justify-end relative overflow-hidden group reveal">
              <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-all duration-1000 group-hover:scale-110">
                <img alt="dining" className="w-full h-full object-cover" src={IMG_DINING} />
              </div>
              <div className="relative z-10">
                <span className="text-primary font-label-bold uppercase tracking-widest text-sm mb-4 block translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">Interactive Experience</span>
                <h2 className="font-headline-lg text-headline-lg mb-4" style={{ fontFamily: 'Bricolage Grotesque' }}>Dine with your eyes first.</h2>
                <p className="font-body-md text-on-surface-variant max-w-md">Our algorithm learns your cravings to show you the most delicious reels from chefs near you.</p>
              </div>
            </div>
            <div className="bg-secondary-container rounded-lg p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-500 reveal" style={{ transitionDelay: '150ms' }}>
              <div className="w-12 h-12 bg-on-background/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-background">bolt</span>
              </div>
              <div>
                <h3 className="font-headline-md text-2xl mb-2" style={{ fontFamily: 'Bricolage Grotesque' }}>Instant Order</h3>
                <p className="text-sm text-on-surface-variant">Three taps from reel to real food at your door.</p>
              </div>
            </div>
            <div className="bg-primary-container text-white rounded-lg p-8 flex flex-col justify-between group hover:shadow-xl transition-all duration-500 reveal" style={{ transitionDelay: '300ms' }}>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white">verified</span>
              </div>
              <div>
                <h3 className="font-headline-md text-2xl mb-2" style={{ fontFamily: 'Bricolage Grotesque' }}>Curated Menus</h3>
                <p className="text-sm opacity-80">Only the best local creators and hidden culinary gems.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-low border-t border-outline/5">
        <div className="max-w-[1280px] mx-auto px-5 py-section-gap flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="space-y-4">
            <div className="font-display-xl text-headline-md text-primary italic" style={{ fontFamily: 'Bricolage Grotesque' }}>Fuudr</div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Satisfy your cravings instantly. Discover the best food near you through immersive video.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-3">
              <span className="font-label-bold text-xs uppercase tracking-widest text-outline">Company</span>
              {['About Us', 'Creators', 'Partner with Us'].map(l => <a key={l} className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">{l}</a>)}
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-label-bold text-xs uppercase tracking-widest text-outline">Support</span>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="mailto:solvers.real@gmail.com">Contact</a>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#/terms">Terms of Service</a>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#/privacy">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-5 py-8 border-t border-outline/10 text-center md:text-left">
          <p className="text-xs text-outline" style={{ fontFamily: 'Plus Jakarta Sans' }}>© 2026 Fuudr. All rights reserved.</p>
        </div>
      </footer>

      {/* Welcome Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="font-headline-lg text-2xl mb-2" style={{ fontFamily: 'Bricolage Grotesque' }}>You're on the list! 🎉</h2>
              <p className="font-body-md text-on-surface-variant mb-6">
                Thanks for joining the Fuudr waitlist. We'll notify you when we launch so you can start discovering delicious food near you.
              </p>
              <button
                onClick={() => setShowPopup(false)}
                className="btn-fancy bg-primary text-white font-label-bold text-label-bold px-8 py-3 rounded-full w-full"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [hash, setHash] = React.useState(window.location.hash);
  React.useEffect(() => {
    const fn = () => setHash(window.location.hash);
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  if (hash === '#/terms') return <Terms />;
  if (hash === '#/privacy') return <Privacy />;
  return <Landing />;
}

export default App;
