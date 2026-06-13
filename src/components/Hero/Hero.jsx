import React from 'react';
import { SplitText } from '../SplitText';
import './Hero.css';

export const Hero = () => {
  return (
    <section className="hero">
      <div className="center">
        <h1>
          <span className="line"><span><SplitText text="order" /></span></span>
          <span className="line"><span><SplitText text="from " /><span className="it"><SplitText text="real reels." /></span></span></span>
        </h1>
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
