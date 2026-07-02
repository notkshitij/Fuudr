import React from 'react';
import './Navbar.css';

export const Navbar = () => {
  return (
    <nav className="brutal-nav">
      <div className="nav-group l nav-fade-target">
      </div>
      
      <div className="brand-logo nav-fade-target">
        <div className="logo-circle">
          <span className="logo-text">Fuudr</span>
        </div>
      </div>

      <div className="nav-group r nav-fade-target">
      </div>

      <div className="mobile-menu-btn">
        <button className="brutal-btn" style={{ padding: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }} aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7"></line>
            <line x1="4" y1="17" x2="20" y2="17"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
};
