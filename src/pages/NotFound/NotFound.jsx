import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './NotFound.css';

export function NotFound() {
  const sliceRef = useRef(null);

  useEffect(() => {
    const slice = sliceRef.current;
    if (!slice) return;

    let frame;
    let angle = -15;
    let direction = 1;

    const animate = () => {
      angle += 0.04 * direction;
      if (angle > 5) direction = -1;
      if (angle < -25) direction = 1;
      slice.style.transform = `rotate(${angle}deg)`;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Helmet>
        <title>404 – Page Not Found | Fuudr</title>
        <meta name="description" content="Oops! This page doesn't exist on Fuudr. Head back to discover food reels and order instantly." />
      </Helmet>

      <div className="notfound-page">
        {/* Big background text */}
        <div className="notfound-bg-text">404</div>

        <div className="notfound-content">
          {/* Floating pizza slice */}
          <div className="notfound-pizza-wrap">
            <img
              ref={sliceRef}
              src="/hero_pizza.avif"
              alt="Lost pizza slice"
              className="notfound-pizza"
            />
          </div>

          <div className="notfound-text-block">
            <div className="notfound-tag">oops!</div>
            <h1 className="notfound-heading">
              This page<br />
              <span className="notfound-accent">got eaten.</span>
            </h1>
            <p className="notfound-sub">
              Looks like this page doesn't exist — maybe it was too delicious to last.
            </p>
            <Link to="/" className="brutal-btn notfound-btn">
              🍕 Back to Fuudr
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
