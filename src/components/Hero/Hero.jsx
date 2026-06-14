import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from '../SplitText';
import './Hero.css';

export const Hero = () => {
  const heroRef = useRef(null);
  const expandVideoRef = useRef(null);

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

  return (
    <section className="hero" ref={heroRef}>
      <video 
        ref={expandVideoRef}
        className="hero-video-expand" 
        autoPlay loop muted playsInline
      >
        <source src="/reel.mp4" type="video/mp4" />
      </video>

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
