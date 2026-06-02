import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

function Terms() {
  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      <div className="container no-scrollbar" style={{ overflowY: 'auto', paddingBottom: '4rem', height: '100vh' }}>
        <header>
          <a href="#/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'inherit', textDecoration: 'none', fontWeight: 700, fontSize: '1.5rem' }}>
            <UtensilsCrossed className="logo-icon" size={28} style={{ color: 'var(--primary)' }} />
            <span className="logo-text">Reel<span className="logo-highlight">ish</span></span>
          </a>
        </header>
        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 className="title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Terms of Service</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem' }}>
              <p>Welcome to Reelish. By using our platform, you agree to the following terms and conditions.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>1. Usage Rights</h3>
              <p>You agree to use this application for lawful purposes only and respect all content guidelines. Reelish grants you a limited, non-exclusive license to use the platform.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>2. Privacy</h3>
              <p>Your privacy is important to us. Please refer to our Privacy Policy for more information on how we handle your data and safeguard your information.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>3. Modifications</h3>
              <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes your consent to such changes.</p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img 
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop" 
              alt="Terms Food Banner" 
              style={{ width: '100%', maxWidth: '400px', borderRadius: '30px', objectFit: 'cover', height: '550px', border: '2px solid var(--glass-border)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Terms;
