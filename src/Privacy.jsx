import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

function Privacy() {
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
            <h1 className="title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Privacy Policy</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem' }}>
              <p>At Reelish, we take your privacy seriously. This policy describes how we collect, use, and protect your data.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>1. Data Collection</h3>
              <p>We only collect the information necessary to provide you with the best short-form food video experience, such as your email address when joining the waitlist or your location for food delivery.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>2. Data Usage</h3>
              <p>Your data is never sold to third parties. It is used strictly to notify you about our launch, personalize your content feed, and process potential orders.</p>
              <br/>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>3. Security</h3>
              <p>We employ industry-standard security measures and encryption to ensure your personal information remains safe from unauthorized access.</p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img 
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop" 
              alt="Privacy Food Banner" 
              style={{ width: '100%', maxWidth: '400px', borderRadius: '30px', objectFit: 'cover', height: '550px', border: '2px solid var(--glass-border)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Privacy;
