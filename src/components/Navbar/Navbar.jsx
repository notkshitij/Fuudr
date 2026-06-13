import React from 'react';
import './Navbar.css';

export const Navbar = () => {
  return (
    <nav>
      <div className="l brand-logo">fuud<span>r</span></div>
      <div className="r">
        <a href="https://www.linkedin.com/company/tryfuudr/" target="_blank" rel="noopener noreferrer">linkedin</a>
        <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer">instagram</a>
        <a href="https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N" target="_blank" rel="noopener noreferrer">whatsapp</a>
      </div>
    </nav>
  );
};
