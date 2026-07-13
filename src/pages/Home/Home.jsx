import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { Navbar } from '../../components/Navbar/Navbar';
import { Helmet } from 'react-helmet-async';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=60", alt: "Pizza", likes: "1.2k", comments: "84" },
  { src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=60", alt: "Burger", likes: "8.4k", comments: "120" },
  { src: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=60", alt: "Pasta", likes: "2.1k", comments: "310" },
  { src: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=60", alt: "Momos and Dumplings", likes: "3.4k", comments: "67" },
  { src: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=60", alt: "Manchurian Asian Bowl", likes: "9.2k", comments: "430" },
  { src: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400&q=60", alt: "Italian Spread", likes: "1.8k", comments: "92" },
  { src: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=60", alt: "Chinese Noodles", likes: "4.2k", comments: "150" },
  { src: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=60", alt: "Mexican Tacos", likes: "2.7k", comments: "115" }
];

export function Home() {
  const marqueeRef = useRef(null);

  useEffect(() => {
    // Lenis Smooth Scroll setup
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      smoothTouch: false
    });
    window.lenis = lenis;
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // 1. Hero Animations
      gsap.from('.hero-bg-text', {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
      // Pull out the pizza slice when scrolling
      gsap.to('.hero-center-img-slice-scroll-wrapper', {
        x: '25vw',
        y: '10vh',
        rotation: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.slice-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Waitlist Collage Parallax (Smooth Scrolling Effect)
      gsap.to('.bg-collage img', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.slice-waitlist',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

      // 3. Scroll Reveals
      gsap.utils.toArray('.brutal-card, .stat-item, .menu-item').forEach(el => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%'
          }
        });
      });
      
      gsap.from('.slice-promo .xl', {
        scale: 0.8,
        opacity: 0,
        rotation: -5,
        duration: 1,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.slice-promo',
          start: 'top 70%'
        }
      });

      // 4. Floating Ingredients Scroll Animation
      gsap.from('.floating-img-1', {
        x: -150,
        y: -100,
        rotation: -60,
        opacity: 0,
        scrollTrigger: {
          trigger: '.slice-about',
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        }
      });

      gsap.from('.floating-img-2', {
        x: 150,
        y: 100,
        rotation: 60,
        opacity: 0,
        scrollTrigger: {
          trigger: '.slice-about',
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        }
      });

      // 5. Photo Gallery Horizontal Scroll
      gsap.fromTo('.photo-gallery', 
        { x: '15vw' },
        { 
          x: '-25vw',
          ease: 'none',
          scrollTrigger: {
            trigger: '.photo-gallery',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
            invalidateOnRefresh: true
          }
        }
      );

      // 6. Hide Navbar items on Footer
      ScrollTrigger.create({
        trigger: '.slice-footer',
        start: 'top 150px',
        onEnter: () => {
          gsap.to('.nav-fade-target', { autoAlpha: 0, duration: 0.3 });
          gsap.to('.brand-logo', { scale: 0.8, duration: 0.3 }, '<');
        },
        onLeaveBack: () => {
          gsap.to('.nav-fade-target', { autoAlpha: 1, duration: 0.3 });
          gsap.to('.brand-logo', { scale: 1, duration: 0.3 }, '<');
        }
      });

    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="slice-home">
      <Helmet>
        <title>Fuudr | See it. Crave it. Order it. — Food Reel App</title>
        <meta name="description" content="Fuudr is a short-form food reel app. Watch video reels of dishes from restaurants near you and order instantly. Think TikTok meets Zomato." />
        <link rel="canonical" href="https://fuudr.com/" />
      </Helmet>
      <Navbar />

      {/* HERO SECTION */}
      <section className="slice-hero">
        <div className="hero-bg-text">
          <div className="xl hero-line-1">REELS</div>
          <div className="xl hero-line-2">MEALS</div>
        </div>
        <div className="hero-text-block">
          <h1 className="hero-heading">
            <span className="hero-heading-line dark">WATCH REELS.</span>
            <span className="hero-heading-line light">DISCOVER FOOD.</span>
            <span className="hero-heading-line dark">ORDER INSTANTLY.</span>
          </h1>
          <p className="hero-subtext">
            Short videos of real dishes.<br />
            Real cravings. Ordered in a tap.
          </p>
          <div className="hero-squiggle-wrapper">
            <svg width="120" height="12" viewBox="0 0 120 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9C30 3 60 3 90 7C105 9 113 9 117 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="hero-pizza-wrapper">
          <img 
            src="/pizza.avif" 
            alt="Fuudr App Pizza Base" 
            className="hero-center-img-base" 
            style={{ width: '100%', filter: 'drop-shadow(0px 30px 40px rgba(0,0,0,0.3))' }}
          />
          <div className="hero-center-img-slice-scroll-wrapper" style={{ position: 'absolute', width: '100%' }}>
            <img 
              src="/hero_pizza.avif" 
              alt="Fuudr App Pizza Slice" 
              className="hero-center-img-slice" 
              style={{ width: '100%', filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }}
            />
          </div>
        </div>
        
        <div className="hero-bottom-actions">
          <button className="brutal-btn" onClick={() => window.open('https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N', '_blank')} style={{ fontSize: '18px', padding: '6px 24px', borderRadius: '12px' }}>
            Join Community 
            <span style={{
              background: '#FCA311', 
              color: '#000', 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px', 
              fontWeight: 'bold',
              border: '2px solid #000'
            }}>+</span>
          </button>

          <Link to="/partner" className="brutal-btn" style={{ fontSize: '18px', padding: '6px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#000' }}>
            Register as a Restaurant
            <span style={{
              background: '#FCA311', 
              color: '#000', 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px solid #000'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </span>
          </Link>
        </div>
      </section>

      {/* CHECKER DIVIDER */}
      <div className="checker-wrapper">
        <div className="checker-divider"></div>
      </div>

      {/* ABOUT US */}
      <section className="slice-about" id="about" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/img1.avif" alt="Floating ingredient" className="floating-img-1" style={{ position: 'absolute', top: '15%', left: '8%', width: 'clamp(80px, 10vw, 120px)', filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.2))', zIndex: 5, transform: 'rotate(-10deg)' }} />
        <img src="/img2.avif" alt="Floating ingredient" className="floating-img-2" style={{ position: 'absolute', top: '45%', right: '8%', width: 'clamp(80px, 10vw, 120px)', filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.2))', zIndex: 5, transform: 'rotate(15deg)' }} />

        <div className="about-header" style={{textAlign: 'center', position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', padding: '0 20px'}}>
          <h2 className="xl about-title" style={{ fontSize: 'clamp(32px, 5vw, 80px)', lineHeight: 1.1, color: '#3D2101', textShadow: '2px 2px 0 #fff', textTransform: 'none', marginBottom: '24px' }}>
            Order From Reels
          </h2>
          <p className="about-text" style={{ color: '#331C11', fontSize: 'clamp(13px, 3.5vw, 22px)', lineHeight: '1.6', fontWeight: 600, marginBottom: '40px', padding: '0 5px' }}>
            See real videos before you order, smart recommendations show you hidden gems near you. Order in a few taps and enjoy. Great food exists all around us, but most people never discover it through traditional apps.
          </p>

          <button className="brutal-btn" style={{ fontSize: '14px', padding: '6px 20px', borderRadius: '50px', margin: '0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff', border: '2px solid #000', boxShadow: '-3px 3px 0 #000', cursor: 'pointer' }}>
            <span style={{ fontWeight: 800, color: '#000' }}>Order on -</span> 
            <span style={{ color: '#E63946', fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '16px' }}>fuudr</span>
          </button>
        </div>

        {/* PHOTO GALLERY */}
        <div className="photo-gallery">
          {[...galleryImages, ...galleryImages].map((img, i) => (
            <div key={i} className="polaroid" style={{ padding: 0, height: '340px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <img src={img.src} alt={img.alt} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none' }} />
              
              <div style={{ position: 'absolute', bottom: '85px', right: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{img.comments}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{img.likes}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
              
              <div className="discovery-actions" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                <button className="discovery-btn" style={{ flex: 1, background: '#FCA311', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Add to Cart</button>
                <button className="discovery-btn" style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Menu</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}


      {/* TESTIMONIALS SECTION */}
      <section className="slice-testimonials" style={{ position: 'relative', minHeight: '900px', background: 'var(--bg-light)', overflow: 'hidden', padding: '100px 0' }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, marginBottom: '60px' }}>
          <h2 className="xl" style={{ fontSize: 'clamp(32px, 5vw, 80px)', lineHeight: 1.1, color: '#3D2101', textShadow: '2px 2px 0 #fff', textTransform: 'none' }}>
            Why people use<br/>fuudr?
          </h2>
        </div>

        {/* Decorative Crumbs */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: '8px', height: '8px', background: '#3D2101', borderRadius: '50%', opacity: 0.6 }}></div>
        <div style={{ position: 'absolute', top: '25%', left: '20%', width: '4px', height: '4px', background: '#3D2101', borderRadius: '50%', opacity: 0.4 }}></div>
        <div style={{ position: 'absolute', top: '45%', right: '10%', width: '6px', height: '6px', background: '#3D2101', borderRadius: '50%', opacity: 0.7 }}></div>
        <div style={{ position: 'absolute', bottom: '20%', left: '30%', width: '10px', height: '10px', background: '#3D2101', borderRadius: '50%', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '25%', width: '5px', height: '5px', background: '#3D2101', borderRadius: '50%', opacity: 0.8 }}></div>

        <div className="testimonials-canvas" style={{ position: 'relative', width: '100%', maxWidth: '1400px', margin: '0 auto', height: '650px', marginTop: '40px' }}>
          
          {/* Yellow Note */}
          <div className="sticky-note yellow" style={{ top: '5%', left: '10%', transform: 'rotate(-3deg)', zIndex: 3 }}>
            <div className="pin red" style={{ top: '15px', left: '15px' }}></div>
            <p>Seeing real videos of the food makes deciding what to eat 10x easier.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Pink Note */}
          <div className="sticky-note pink" style={{ bottom: '10%', left: '15%', transform: 'rotate(2deg)', zIndex: 4 }}>
            <div className="tape" style={{ top: '-15px', left: '50%', width: '100px', height: '30px', transform: 'translateX(-50%) rotate(-2deg)', background: '#E2D9B8' }}></div>
            <p>Scrolling through aesthetic videos and ordering in just 3 taps is the ultimate flex.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Center Polaroid */}
          <div className="polaroid-photo" style={{ top: '15%', left: '50%', transform: 'translateX(-50%) rotate(-5deg)', zIndex: 2, width: '320px', position: 'relative' }}>
            <div className="tape" style={{ top: '-25px', left: '45%', width: '40px', height: '80px', transform: 'rotate(2deg)', background: '#CFCBAE' }}></div>
            <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
              <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80" alt="Exotic Sushi Platter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ color: '#FCA311', fontSize: '72px', lineHeight: 0.8, fontFamily: '"Brush Script MT", cursive', textShadow: '3px 3px 0 #2B1600', transform: 'rotate(-5deg)' }}>
                  fuudr
                </span>
              </div>
            </div>
          </div>

          {/* Blue Note */}
          <div className="sticky-note blue" style={{ bottom: '15%', right: '35%', transform: 'rotate(-2deg)', zIndex: 5 }}>
            <div className="pin blue" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}></div>
            <p>Trust what you see. No fake photos, just honest food and real recommendations from the community.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Green Note */}
          <div className="sticky-note green" style={{ top: '10%', right: '12%', transform: 'rotate(4deg)', zIndex: 3 }}>
            <div className="tape" style={{ top: '-10px', right: '-10px', width: '90px', height: '25px', transform: 'rotate(15deg)', background: '#F4CFDF' }}></div>
            <p>Find those amazing hidden restaurants nearby that never show up on regular delivery apps.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Right Polaroid */}
          <div className="polaroid-photo" style={{ bottom: '0%', right: '8%', transform: 'rotate(6deg)', zIndex: 4, width: '280px' }}>
            <div className="pin red" style={{ top: '15px', left: '15px' }}></div>
            <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80" alt="Gourmet Tacos" style={{ height: '260px', objectFit: 'cover' }} />
          </div>
          
        </div>
      </section>

      {/* PARTNER CTA SECTION */}
      <section className="slice-waitlist" id="partner-cta" style={{ position: 'relative', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* BACKGROUND COLLAGE */}
        <div className="bg-collage" style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#3b2207' }}>
          <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '45vw', height: '60%', objectFit: 'cover', transform: 'rotate(-5deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', top: '-5%', right: '-10%', width: '50vw', height: '55%', objectFit: 'cover', transform: 'rotate(4deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40vw', height: '60%', objectFit: 'cover', transform: 'rotate(6deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55vw', height: '65%', objectFit: 'cover', transform: 'rotate(-4deg)', border: '12px solid #3b2207' }} alt="" />
        </div>

        <h2 className="xl" style={{ position: 'relative', zIndex: 10, color: '#FCA311', fontSize: 'clamp(48px, 6vw, 80px)', marginBottom: '40px', textTransform: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Grow Your Business</h2>

        <div className="reservation-card" style={{ position: 'relative', zIndex: 10, background: '#F5F0E6', padding: '60px 40px', borderRadius: '16px', width: '100%', maxWidth: '550px', borderLeft: '8px solid #000', borderBottom: '8px solid #000', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#3b2207', marginBottom: '16px' }}>Are you a Restaurant Owner?</h3>
          <p style={{ color: '#555', fontSize: '16px', fontWeight: 600, lineHeight: 1.5, marginBottom: '32px' }}>
            Join the Fuudr Partner Program. Upload food reels, manage your menu, track operating hours, and start receiving direct orders from hungry local customers.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.href = '/partner/signup'}
              style={{ flex: '1 1 200px', background: '#FCA311', color: '#000', fontSize: '18px', fontWeight: 800, padding: '16px 24px', borderRadius: '8px', border: '3px solid #000', boxShadow: '4px 4px 0 #000', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--sans)' }}
            >
              Register Restaurant
            </button>
            <button 
              onClick={() => window.location.href = '/partner'}
              style={{ flex: '1 1 200px', background: '#fff', color: '#000', fontSize: '18px', fontWeight: 800, padding: '16px 24px', borderRadius: '8px', border: '3px solid #000', boxShadow: '4px 4px 0 #000', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--sans)' }}
            >
              Partner Sign In
            </button>
          </div>
        </div>
      </section>

      {/* SOCIAL DISCOVERY SECTION */}
      <section className="slice-discovery" style={{ position: 'relative', padding: '100px 20px', background: '#F5F0E6', overflow: 'hidden' }}>
        
        {/* CHECKER DIVIDER FADE OVER BEIGE BACKGROUND */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100px',
          backgroundImage: 'conic-gradient(#fff 90deg, transparent 90deg 180deg, #fff 180deg 270deg, transparent 270deg)',
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 10px, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 10px, rgba(0,0,0,0) 100%)',
          zIndex: 5
        }}></div>

        <div className="discovery-container" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3vw', maxWidth: '1600px', margin: '0 auto', flexWrap: 'wrap' }}>
          
          <div className="discovery-group" style={{ display: 'flex', gap: '20px' }}>
            {/* Card 1 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '85px', right: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>84</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>12k</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
              <div className="discovery-actions" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                <button className="discovery-btn" style={{ flex: 1, background: '#FCA311', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Add to Cart</button>
                <button className="discovery-btn" style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Menu</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '85px', right: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>120</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>8.4k</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
              <div className="discovery-actions" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                <button className="discovery-btn" style={{ flex: 1, background: '#FCA311', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Add to Cart</button>
                <button className="discovery-btn" style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Menu</button>
              </div>
            </div>
          </div>

          {/* Center Text */}
          <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer" className="discovery-text" style={{ padding: '0 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '300px', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '8px', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '3px 3px 0 #000' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <h2 className="xl discovery-heading" style={{ color: '#3D2101', fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.2, textTransform: 'none' }}>
              Follow the <br className="desktop-br"/> discovery <br className="desktop-br"/> <span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '1.2em' }}>@tryfuudr</span>
            </h2>
          </a>

          <div className="discovery-group" style={{ display: 'flex', gap: '20px' }}>
            {/* Card 3 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '85px', right: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>310</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>24k</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
              <div className="discovery-actions" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                <button className="discovery-btn" style={{ flex: 1, background: '#FCA311', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Add to Cart</button>
                <button className="discovery-btn" style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Menu</button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '85px', right: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>67</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>9.2k</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
              <div className="discovery-actions" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                <button className="discovery-btn" style={{ flex: 1, background: '#FCA311', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Add to Cart</button>
                <button className="discovery-btn" style={{ flex: 1, background: '#fff', color: '#000', border: '2px solid #000', padding: '6px 0', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '2px 2px 0 #000', fontFamily: 'var(--sans)' }}>Menu</button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CHECKER DIVIDER */}
      <div style={{ width: '100%', height: '20px', backgroundImage: 'conic-gradient(#fff 90deg, #4f2e09 90deg 180deg, #fff 180deg 270deg, #4f2e09 270deg)', backgroundSize: '20px 20px' }}></div>

      {/* FOOTER MARQUEE */}
      <div className="footer-marquee" style={{ background: '#4f2e09', paddingTop: '30px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex' }}>
        <div className="marquee-track" style={{ display: 'inline-flex', alignItems: 'center', animation: 'footerMarquee 45s linear infinite', width: 'max-content' }}>
          {[...Array(16)].map((_, i) => (
            <div key={i} className="xl footer-marquee-text" style={{ color: '#cccccc', margin: 0, padding: '0 20px' }}>
              Order - <span style={{ color: '#FCA311' }}>fuudr</span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="slice-footer" style={{ background: '#4f2e09', color: '#fff', position: 'relative', overflow: 'hidden', padding: '40px 40px 30px', textAlign: 'center' }}>
        <div className="footer-content" style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
          
          <div className="footer-badge" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #FCA311', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', background: '#4f2e09', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ transform: 'rotate(-10deg)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#FCA311', fontSize: '42px', lineHeight: 0.8, fontFamily: '"Brush Script MT", cursive', textShadow: '3px 3px 0 #2B1600' }}>
                fuudr
              </span>
            </div>
          </div>

          <h2 className="xl" style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '20px' }}>See it. Crave it. Eat it.</h2>

          <div className="footer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <button className="brutal-btn footer-join-btn" onClick={() => window.open('https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N', '_blank')} style={{ padding: '16px 32px', fontSize: '20px', borderRadius: '12px' }}>Join Community</button>
            <button className="brutal-btn footer-register-btn" onClick={() => document.getElementById('partner-cta')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '16px 32px', fontSize: '20px', borderRadius: '12px' }}>Register Restaurant</button>
          </div>

          <div className="footer-socials" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
            {[
              { name: 'LinkedIn', color: '#0077b5', url: 'https://www.linkedin.com/company/tryfuudr/', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> },
              { name: 'Instagram', gradient: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', url: 'https://www.instagram.com/tryfuudr/', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> }
            ].map(social => (
              <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="brutal-btn" style={{ textDecoration: 'none', background: '#4f2e09', color: '#fff', padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: '2px solid #5A3515', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: social.gradient || social.color, borderRadius: '6px', color: '#fff' }}>
                  {social.icon}
                </span>
                <span style={{ fontWeight: '500' }}>{social.name}</span>
              </a>
            ))}
          </div>

          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', paddingBottom: '15px', fontSize: '14px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ color: '#aaa', fontFamily: 'var(--sans)' }}>Designed by <a href="https://thesolvers.online" target="_blank" rel="noopener noreferrer" style={{ color: '#FCA311', fontWeight: 'bold', textDecoration: 'none' }}>The Solvers</a></div>
            <div style={{ display: 'flex', gap: '20px', color: '#aaa', fontFamily: 'var(--sans)' }}>
              <Link to="/privacy" className="footer-policy-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-policy-link">Terms of Service</Link>
            </div>
          </div>

        </div>

        {/* Checkerboard Bottom Border */}
        <div className="checker-divider" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.15, transform: 'translateY(5px)' }}></div>

        {/* Scroll To Top Button */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="brutal-btn"
          style={{ 
            position: 'absolute', 
            bottom: '30px', 
            right: '40px', 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: '#FCA311', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '3px solid #000', 
            boxShadow: '4px 4px 0 #000',
            cursor: 'pointer',
            zIndex: 20
          }}
          aria-label="Scroll to top"
        >
          <span style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', lineHeight: 1, marginTop: '-4px' }}>↑</span>
        </button>
      </footer>

    </div>
  );
}
