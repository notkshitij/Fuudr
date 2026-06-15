import React from 'react';
import './Navbar.css';

export const Navbar = () => {
  return (
    <nav className="brutal-nav">
      <div className="nav-group l">
        <a href="#home" className="brutal-btn nav-btn" style={{ background: 'var(--bg)' }}>Home App</a>
      </div>
      
      <div className="brand-logo">
        <div className="logo-circle">
          <span className="logo-text">Fuudr</span>
        </div>
      </div>

      <div className="nav-group r">
        <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer" className="brutal-btn nav-btn">Instagram</a>
        <a href="https://www.linkedin.com/company/tryfuudr/" target="_blank" rel="noopener noreferrer" className="brutal-btn nav-btn">LinkedIn</a>
      </div>
    </nav>
  );
};
