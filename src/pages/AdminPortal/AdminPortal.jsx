import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, TrendingUp, PackageSearch, Video, Wallet } from 'lucide-react';
import './AdminPortal.css';

gsap.registerPlugin(ScrollTrigger);

export function AdminPortal() {
  useEffect(() => {
    // Scroll to top when entering page
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      gsap.from('.admin-header h1', { y: 40, opacity: 0, duration: 1, ease: 'expo.out' });
      gsap.from('.admin-header p', { y: 20, opacity: 0, duration: 1, delay: 0.2, ease: 'expo.out' });
      
      gsap.utils.toArray('.feature-block').forEach((block) => {
        gsap.from(block, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 85%'
          }
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="admin-portal">
      <Link to="/" className="back-btn">
        <ArrowLeft size={16} /> Back to Consumer App
      </Link>

      <div className="admin-header">
        <h1>Command your <br/><span className="it">kitchen.</span></h1>
        <p>The exclusive Fuudr back-office application designed for modern restaurant operators and ghost kitchens to manage everything in real-time.</p>
      </div>

      <div className="admin-features">
        
        {/* Dashboard */}
        <div className="feature-block">
          <div className="feature-text">
            <h2>Real-Time <span className="faux-accent">Analytics</span></h2>
            <p>Track your daily revenue, active orders, and top-selling dishes by the second. The live dashboard gives you a bird's-eye view of your kitchen's performance.</p>
          </div>
          <div className="feature-visual">
            <div className="faux-card">
              <div className="faux-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16}/> Today's Sales</div>
              <div className="faux-value">$4,285<span style={{ fontSize: '16px', color: 'var(--acc)'}}>.50</span></div>
            </div>
            <div className="faux-card">
              <div className="faux-title">Active Orders</div>
              <div className="faux-value faux-accent">14</div>
            </div>
          </div>
        </div>

        {/* Menu & Orders */}
        <div className="feature-block reverse">
          <div className="feature-text">
            <h2>Menu & <span className="faux-accent">Orders</span></h2>
            <p>Easily upload new dishes, toggle item availability, and manage pricing. The live order screen lets your kitchen staff accept, prep, and dispatch orders flawlessly.</p>
          </div>
          <div className="feature-visual">
            <div className="faux-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: '#333', padding: '12px', borderRadius: '12px' }}><PackageSearch color="#fff"/></div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>Spicy Tuna Bowl</div>
                <div style={{ color: 'var(--acc)', fontSize: '14px' }}>In Preparation • Order #1042</div>
              </div>
            </div>
            <div className="faux-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: '#333', padding: '12px', borderRadius: '12px' }}><PackageSearch color="#fff"/></div>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>Smashburger Combo</div>
                <div style={{ color: '#888', fontSize: '14px' }}>Pending Acceptance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic Reels */}
        <div className="feature-block">
          <div className="feature-text">
            <h2>Cinematic <span className="faux-accent">Reels</span></h2>
            <p>Upload mouth-watering, slow-motion videos directly from your phone and link them to specific menu items to drive conversion rates off the charts.</p>
          </div>
          <div className="feature-visual" style={{ alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Video size={32} color="#fff" />
             </div>
             <div style={{ marginTop: '16px', color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>UPLOAD MEDIA</div>
          </div>
        </div>

        {/* Payouts */}
        <div className="feature-block reverse">
          <div className="feature-text">
            <h2>Profile & <span className="faux-accent">Payouts</span></h2>
            <p>Manage your operating hours, update business details, and securely connect your banking information for lightning-fast payouts on your sales.</p>
          </div>
          <div className="feature-visual">
            <div className="faux-card">
              <div className="faux-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={16}/> Next Payout</div>
              <div className="faux-value">$12,450.00</div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>Scheduled for tomorrow</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
