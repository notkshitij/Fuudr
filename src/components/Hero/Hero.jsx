import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from '../SplitText';
import heroImg from '../../assets/hero.png';
import './Hero.css';

export const Hero = () => {
  const heroRef = useRef(null);
  const expandVideoRef = useRef(null);
  const floatRefs = useRef([]);

  const handleMouseEnter = () => {
    if (!heroRef.current || !expandVideoRef.current) return;
    document.body.classList.add('hero-expanded');
    gsap.to(expandVideoRef.current, {
      clipPath: 'circle(150% at 50% 50%)',
      duration: 1.2,
      ease: 'power3.inOut'
    });
  };

  const handleMouseLeave = () => {
    if (!heroRef.current || !expandVideoRef.current) return;
    document.body.classList.remove('hero-expanded');
    gsap.to(expandVideoRef.current, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 0.8,
      ease: 'power3.out'
    });
  };

  useEffect(() => {
    return () => document.body.classList.remove('hero-expanded');
  }, []);

  // Entrance animation for floating images
  useEffect(() => {
    const els = floatRefs.current.filter(Boolean);
    if (!els.length) return;

    gsap.fromTo(
      els,
      { opacity: 0, scale: 0.7, y: 60 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.3
      }
    );
  }, []);

  // Mouse-move parallax
  useEffect(() => {
    const section = heroRef.current;
    if (!section) return;

    const handleMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2;

      floatRefs.current.forEach((el) => {
        if (!el) return;
        const depth = parseFloat(el.dataset.depth || '1');
        gsap.to(el, {
          x: x * 24 * depth,
          y: y * 24 * depth,
          duration: 0.6,
          ease: 'power2.out'
        });
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <video 
        ref={expandVideoRef}
        className="hero-video-expand" 
        autoPlay loop muted playsInline
      >
        <source src="/reel.mp4" type="video/mp4" />
      </video>

      {/* Floating decorative images with parallax */}
      <img
        ref={(el) => (floatRefs.current[0] = el)}
        data-depth="1.4"
        className="hero-float hero-float-1"
        src={heroImg}
        alt=""
        aria-hidden="true"
      />
      <img
        ref={(el) => (floatRefs.current[1] = el)}
        data-depth="0.8"
        className="hero-float hero-float-2"
        src={heroImg}
        alt=""
        aria-hidden="true"
      />
      <img
        ref={(el) => (floatRefs.current[2] = el)}
        data-depth="1.1"
        className="hero-float hero-float-3"
        src={heroImg}
        alt=""
        aria-hidden="true"
      />

      <div className="center">
        <div className="text-mask-container">
          <video className="hero-video-masked" autoPlay loop muted playsInline>
            <source src="/reel.mp4" type="video/mp4" />
          </video>
          <h1 className="hero-title" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span className="line"><span><SplitText text="order" /></span></span>
            <span className="line"><span><SplitText text="from " /><span className="it"><SplitText text="real reels." /></span></span></span>
          </h1>
        </div>
      </div>

      <div className="bottom">
        <h2>Experience the next evolution of <a href="#">food discovery</a></h2>
        <div className="links">
          <a href="#" onClick={(e) => e.preventDefault()} className="filled">join waitlist <span className="arr">↓</span></a>
          <a href="https://youtu.be/60f3TvS6ybg?si=Hx1tmPHs25-FDW5J" target="_blank" rel="noopener noreferrer">watch demo</a>
        </div>
      </div>
    </section>
  );
};
