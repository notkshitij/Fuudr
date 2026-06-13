import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { Navbar } from './components/Navbar/Navbar';
import { Hero } from './components/Hero/Hero';
import { WhyFuudr } from './components/WhyFuudr/WhyFuudr';
import { WhatsBroken } from './components/WhatsBroken/WhatsBroken';
import { PhoneMockup } from './components/PhoneMockup/PhoneMockup';
import { FeaturesHorizontal } from './components/FeaturesHorizontal/FeaturesHorizontal';
import { WaitlistFooter } from './components/WaitlistFooter/WaitlistFooter';

import './App.css';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
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
      gsap.timeline({delay:.2}).to('.hero h1 .line>span',{y:0,duration:1.2,stagger:.08,ease:'expo.out'});

      // Automatic wave of the letter hover effect on startup
      const heroLetters = document.querySelectorAll('.hero h1 .hl');
      heroLetters.forEach((el, i) => {
        gsap.delayedCall(1.5 + (i * 0.15), () => {
          el.classList.add('is-hovered');
          gsap.delayedCall(0.85, () => el.classList.remove('is-hovered'));
        });
      });

      document.querySelectorAll('.scroll-reveal-text').forEach(el => {
        const words = el.querySelectorAll('.w');
        const section = el.closest('.pin-section');
        
        gsap.to(words, {
          opacity: 1,
          ease: 'none',
          stagger: .5,
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=1200',
            pin: true,
            scrub: 1.2,
          }
        });
      });

      gsap.utils.toArray('.num-row, .col').forEach(el => {
        gsap.from(el, {y: 40, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: {trigger: el, start: 'top 88%'}});
      });

      gsap.utils.toArray('.display h2').forEach(el => {
        gsap.from(el, {scale: .9, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: {trigger: el, start: 'top 80%'}});
      });
    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Navbar />
      <Hero />
      <WhyFuudr />
      <WhatsBroken />
      <PhoneMockup />
      <FeaturesHorizontal />
      <WaitlistFooter />
    </>
  );
}
