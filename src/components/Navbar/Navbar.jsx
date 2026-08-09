import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="brutal-nav">
      <div className="nav-group l nav-fade-target">
        <button 
          className="brutal-btn nav-btn" 
          onClick={() => window.open('https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N', '_blank')}
        >
          Join Community
        </button>
      </div>
      
      <div className="brand-logo nav-fade-target">
        <Link to="/" className="block hover:scale-105 active:scale-95 transition-all duration-200" style={{ textDecoration: 'none' }}>
          <div className="logo-circle">
            <span className="logo-text">Fuudr</span>
          </div>
        </Link>
      </div>

      <div className="nav-group r nav-fade-target">
        <a 
          href="https://wa.me/919950388998"
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-btn nav-btn waitlist-btn"
          style={{ textDecoration: 'none', color: '#000' }}
        >
          Request Partnership
        </a>
      </div>

      <div className="mobile-menu-btn">
        <button 
          className="brutal-btn" 
          onClick={() => setIsOpen(!isOpen)}
          style={{ padding: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }} 
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line className={`nav-menu-line-1 ${isOpen ? 'open' : ''}`} x1="4" y1="7" x2="20" y2="7"></line>
            <line className={`nav-menu-line-2 ${isOpen ? 'open' : ''}`} x1="4" y1="17" x2="20" y2="17"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-nav-dropdown ${isOpen ? 'open' : ''}`}>
        <button 
          className="brutal-btn" 
          onClick={() => {
            setIsOpen(false);
            window.open('https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N', '_blank');
          }}
          style={{ 
            fontSize: '18px', 
            padding: '6px 24px', 
            borderRadius: '12px', 
            width: '100%', 
            justifyContent: 'space-between',
            display: 'flex',
            alignItems: 'center'
          }}
        >
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
            border: '2px solid #000',
            flexShrink: 0
          }}>+</span>
        </button>

        <a 
          href="https://wa.me/919950388998"
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-btn"
          onClick={() => setIsOpen(false)}
          style={{ 
            fontSize: '18px', 
            padding: '6px 24px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '8px', 
            textDecoration: 'none', 
            color: '#000', 
            width: '100%',
            background: '#fff'
          }}
        >
          Request Partnership
          <span style={{
            background: '#FCA311', 
            color: '#000', 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px solid #000',
            flexShrink: 0
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </span>
        </a>
      </div>

      {/* Overlay backdrop */}
      {isOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsOpen(false)} />
      )}
    </nav>
  );
};
