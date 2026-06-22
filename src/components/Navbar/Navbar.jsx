import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  return (
    <nav className="brutal-nav">
      <div className="nav-group l nav-fade-target">
        <a href="#home" className="brutal-btn nav-btn" 
        // style={{ background: 'var(--bg)' }}
        >Home App</a>
        <Link to="/partner" className="brutal-btn nav-btn" 
        // style={{ background: 'var(--bg)' }}
        >Register as a Restaurant</Link>
      </div>
      
      <div className="brand-logo nav-fade-target">
        <div className="logo-circle">
          <span className="logo-text">Fuudr</span>
        </div>
      </div>

      <div className="nav-group r nav-fade-target">
        <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer" className="brutal-btn nav-btn">Instagram</a>
        <a href="https://www.linkedin.com/company/tryfuudr/" target="_blank" rel="noopener noreferrer" className="brutal-btn nav-btn">LinkedIn</a>
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
