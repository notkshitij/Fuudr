import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { Navbar } from '../../components/Navbar/Navbar';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const marqueeRef = useRef(null);
  
  useEffect(() => {
    // Lenis Smooth Scroll setup
    const lenis = new Lenis({
      lerp: 0.05,
      wheelMultiplier: 1,
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 2
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

      // Horizontal parallax on hero text when scrolling
      gsap.to('.hero-line-1', {
        xPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.slice-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      
      gsap.to('.hero-line-2', {
        xPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.slice-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
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
            scrub: 1
          }
        }
      );

    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="slice-home">
      <Navbar />

      {/* HERO SECTION */}
      <section className="slice-hero">
        <div className="hero-bg-text">
          <div className="xl hero-line-1">REAL REELS. NO REGRETS.</div>
          <div className="xl hero-line-2">REAL REELS. NO REGRETS.</div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 10, width: '110vw', maxWidth: '1800px', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: 'translateY(8vh)' }}>
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

          <button className="brutal-btn" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: '#fff', color: '#000', fontSize: '18px', padding: '6px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Join Waitlist
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
          </button>
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

        <div className="about-header" style={{textAlign: 'center', position: 'relative', zIndex: 10}}>
          <h2 className="xl">Where Every Perfect<br/>Reel Tells a Story</h2>
          <p className="about-text">
            Our creators are fresh, our kitchens are hot, and our<br/>
            team is fired up to serve you the best food in town. From<br/>
            classic comfort food to loaded flavor bombs, every dish<br/>
            is made with intention, fun, and a little culinary magic.<br/>
            We believe food is more than fuel, it's a celebration.
          </p>
          <button className="brutal-btn" style={{ fontSize: '18px', padding: '12px 24px', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff' }}>
            <span style={{ fontWeight: 800 }}>Order on -</span> 
            <span style={{ color: '#E63946', fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '20px' }}>fuudr</span>
          </button>
        </div>

        {/* PHOTO GALLERY */}
        <div className="photo-gallery">
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" alt="Pizza" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" alt="Burger" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80" alt="Pasta" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80" alt="Momos and Dumplings" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80" alt="Manchurian Asian Bowl" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80" alt="Italian Spread" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80" alt="Chinese Noodles" /></div>
          <div className="polaroid"><img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80" alt="Mexican Tacos" /></div>
        </div>
      </section>

      {/* STATS */}


      {/* TESTIMONIALS SECTION */}
      <section className="slice-testimonials" style={{ position: 'relative', minHeight: '900px', background: 'var(--bg-light)', overflow: 'hidden', padding: '100px 0' }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, marginBottom: '60px' }}>
          <h2 className="xl" style={{ fontSize: 'clamp(48px, 6vw, 80px)', lineHeight: 1.1, color: '#3D2101', textShadow: '2px 2px 0 #fff', textTransform: 'none' }}>
            Why people who<br/>order love fuudr?
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
            <p>Fuudr completely changed how I discover new places to eat. The UI is just so smooth and addictive!</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Pink Note */}
          <div className="sticky-note pink" style={{ bottom: '10%', left: '15%', transform: 'rotate(2deg)', zIndex: 4 }}>
            <div className="tape" style={{ top: '-15px', left: '50%', width: '100px', height: '30px', transform: 'translateX(-50%) rotate(-2deg)', background: '#E2D9B8' }}></div>
            <p>I used to spend 30 minutes just deciding where to order. Now I just scroll Fuudr, see it, and crave it!</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Center Polaroid */}
          <div className="polaroid-photo" style={{ top: '15%', left: '50%', transform: 'translateX(-50%) rotate(-5deg)', zIndex: 2, width: '320px' }}>
            <div className="tape" style={{ top: '-25px', left: '45%', width: '40px', height: '80px', transform: 'rotate(2deg)', background: '#CFCBAE' }}></div>
            <img src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=600&q=80" alt="Friends eating pizza" style={{ height: '300px', objectFit: 'cover' }} />
          </div>

          {/* Blue Note */}
          <div className="sticky-note blue" style={{ bottom: '15%', right: '35%', transform: 'rotate(-2deg)', zIndex: 5 }}>
            <div className="pin blue" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }}></div>
            <p>Finally an app built for foodies. The video discovery feed is exactly what the food delivery space needed.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Green Note */}
          <div className="sticky-note green" style={{ top: '10%', right: '12%', transform: 'rotate(4deg)', zIndex: 3 }}>
            <div className="tape" style={{ top: '-10px', right: '-10px', width: '90px', height: '25px', transform: 'rotate(15deg)', background: '#F4CFDF' }}></div>
            <p>Love how easy it is to find hidden gems around my city. The community recommendations on Fuudr are top-notch.</p>
            <div className="sticky-author">@tryfuudr</div>
          </div>

          {/* Right Polaroid */}
          <div className="polaroid-photo" style={{ bottom: '0%', right: '8%', transform: 'rotate(6deg)', zIndex: 4, width: '280px' }}>
            <div className="pin red" style={{ top: '15px', left: '15px' }}></div>
            <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" alt="People eating" style={{ height: '260px', objectFit: 'cover' }} />
          </div>
          
        </div>
      </section>

      {/* WAITLIST / BOOK */}
      <section className="slice-waitlist" id="waitlist" style={{ position: 'relative', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {/* BACKGROUND COLLAGE */}
        <div className="bg-collage" style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#3b2207' }}>
          <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '45vw', height: '60%', objectFit: 'cover', transform: 'rotate(-5deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', top: '-5%', right: '-10%', width: '50vw', height: '55%', objectFit: 'cover', transform: 'rotate(4deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40vw', height: '60%', objectFit: 'cover', transform: 'rotate(6deg)', border: '12px solid #3b2207' }} alt="" />
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '55vw', height: '65%', objectFit: 'cover', transform: 'rotate(-4deg)', border: '12px solid #3b2207' }} alt="" />
        </div>

        <h2 className="xl" style={{ position: 'relative', zIndex: 10, color: '#FCA311', fontSize: 'clamp(48px, 6vw, 80px)', marginBottom: '40px', textTransform: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Join The Waitlist</h2>

        <div className="reservation-card" style={{ position: 'relative', zIndex: 10, background: '#F5F0E6', padding: '60px 40px', borderRadius: '16px', width: '100%', maxWidth: '500px', borderLeft: '8px solid #000', borderBottom: '8px solid #000', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <form className="res-form" onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>Full Name*</label>
                <input type="text" placeholder="John Smith" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', background: '#fff', fontSize: '16px', outline: 'none' }} required />
              </div>
              <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>Phone number*</label>
                <input type="tel" placeholder="(310) 555-1234" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', background: '#fff', fontSize: '16px', outline: 'none' }} required />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>Email address*</label>
              <input type="email" placeholder="john.smith@email.com" style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', background: '#fff', fontSize: '16px', outline: 'none' }} required />
            </div>

            <button type="submit" style={{ background: '#FCA311', color: '#000', fontSize: '18px', fontWeight: 700, padding: '16px 32px', borderRadius: '8px', border: '3px solid #000', boxShadow: '4px 4px 0 #000', marginTop: '10px', alignSelf: 'flex-start', cursor: 'pointer', transition: 'all 0.2s' }}>Reserve My Spot</button>
          </form>
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
              <div className="play-btn" style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', background: '#fff', border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>

            {/* Card 2 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="play-btn" style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', background: '#fff', border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
          </div>

          {/* Center Text */}
          <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer" className="discovery-text" style={{ padding: '0 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '300px', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '8px', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '3px 3px 0 #000' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <h2 className="xl" style={{ color: '#3D2101', fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.2, textTransform: 'none' }}>
              Follow the <br/> discovery <br/> @tryfuudr
            </h2>
          </a>

          <div className="discovery-group" style={{ display: 'flex', gap: '20px' }}>
            {/* Card 3 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="play-btn" style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', background: '#fff', border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>

            {/* Card 4 */}
            <div className="discovery-card brutal-card" style={{ width: '240px', height: '340px', borderRadius: '16px', border: '4px solid #000', overflow: 'hidden', position: 'relative', background: '#ccc', boxShadow: '6px 6px 0 #000' }}>
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" alt="Video Placeholder 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="play-btn" style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', background: '#fff', border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" style={{ marginLeft: '2px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CHECKER DIVIDER */}
      <div style={{ width: '100%', height: '20px', backgroundImage: 'conic-gradient(#fff 90deg, #4f2e09 90deg 180deg, #fff 180deg 270deg, #4f2e09 270deg)', backgroundSize: '20px 20px' }}></div>

      {/* FOOTER MARQUEE */}
      <div className="footer-marquee" style={{ background: '#4f2e09', paddingTop: '60px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex' }}>
        <div className="marquee-track" style={{ display: 'inline-flex', alignItems: 'center', animation: 'footerMarquee 45s linear infinite', width: 'max-content' }}>
          {[...Array(16)].map((_, i) => (
            <div key={i} className="xl" style={{ color: '#cccccc', fontSize: '64px', margin: 0, padding: '0 20px' }}>
              Order - <span style={{ color: '#FCA311' }}>fuudr</span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="slice-footer" style={{ background: '#4f2e09', color: '#fff', position: 'relative', overflow: 'hidden', padding: '80px 40px 60px', textAlign: 'center' }}>
        <div className="footer-content" style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
          
          <div className="footer-badge" style={{ width: '160px', height: '160px', borderRadius: '50%', border: '4px solid #FCA311', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 60px', background: '#4f2e09', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ transform: 'rotate(-10deg)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#FCA311', fontSize: '56px', lineHeight: 0.8, fontFamily: '"Brush Script MT", cursive', textShadow: '3px 3px 0 #2B1600' }}>
                fuudr
              </span>
            </div>
          </div>

          <h2 className="xl" style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '40px' }}>See it. Crave it. Eat it.</h2>

          <div className="footer-actions" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
            <button className="brutal-btn" onClick={() => window.open('https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N', '_blank')} style={{ background: '#FCA311', color: '#000', padding: '16px 32px', fontSize: '20px', borderRadius: '12px' }}>Join Community</button>
            <button className="brutal-btn" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: '#fff', color: '#000', padding: '16px 32px', fontSize: '20px', borderRadius: '12px' }}>Join Waitlist</button>
          </div>

          <div className="footer-socials" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '80px', flexWrap: 'wrap' }}>
            {[
              { name: 'LinkedIn', color: '#0077b5', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> },
              { name: 'Instagram', gradient: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> }
            ].map(social => (
              <button key={social.name} className="brutal-btn" style={{ background: '#4f2e09', color: '#fff', padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: '2px solid #5A3515', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: social.gradient || social.color, borderRadius: '6px', color: '#fff' }}>
                  {social.icon}
                </span>
                <span style={{ fontWeight: '500' }}>{social.name}</span>
              </button>
            ))}
          </div>

          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #5A3515', paddingTop: '30px', fontSize: '14px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ color: '#aaa', fontFamily: 'var(--sans)' }}>Designed for <span style={{ color: '#FCA311', fontWeight: 'bold' }}>Fuudr</span></div>
            <div style={{ color: '#aaa', fontFamily: 'var(--sans)' }}><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></div>
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
            bottom: '60px', 
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
