import React, { useState, useEffect } from 'react';
import { Bookmark, MessageCircle, Send, Store, UtensilsCrossed } from 'lucide-react';
import './index.css';
import Terms from './Terms';
import Privacy from './Privacy';

function Landing() {
  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="container">
        <header>
          <UtensilsCrossed className="logo-icon" size={28} />
          <span className="logo-text">Reel<span className="logo-highlight">ish</span></span>
        </header>

        <main className="main-content">
          <div className="text-section">
            <h1 className="title">
              See it. Crave it.<br/><span>Order it.</span>
            </h1>
            <p className="subtitle">
              Skip the boring menus. Watch tasty food videos and order your favorite meals instantly.
            </p>
            
            <div className="waitlist-section">
              <div className="coming-soon-badge"><span className="status-dot"></span>Coming Soon</div>
              <form className="email-input-group" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Enter your email address" required className="email-input" />
                <button type="submit" className="join-btn">Join the Waitlist</button>
              </form>
            </div>
          </div>

          <div className="mockup-section">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="video-container">
                  <img 
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop" 
                    alt="Delicious Food" 
                    className="video-cover" 
                  />
                  
                  <div className="tiktok-ui">
                    <div className="side-actions">
                      <div className="action-item">
                        <div className="action-btn">
                          <Bookmark size={24} fill="white" />
                        </div>
                        <span className="action-text">1k</span>
                      </div>
                      <div className="action-item">
                        <div className="action-btn">
                          <MessageCircle size={24} fill="white" />
                        </div>
                        <span className="action-text">25</span>
                      </div>
                      <div className="action-item">
                        <div className="action-btn">
                          <Send size={24} fill="white" />
                        </div>
                        <span className="action-text">18</span>
                      </div>
                    </div>

                    <div className="video-info">
                      <h3 className="restaurant-name">The Classic Burger</h3>
                      <p className="food-desc">5 Oz Patty all Natural Beef...</p>
                      <div className="store-info">
                        <Store size={12} />
                        <span>Black Iron Burger • 1 mile away</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-cta">
            <h2>Ready to explore?</h2>
            <p>Your next favorite dish is one swipe away.</p>
            <button 
              className="download-btn-outline" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Join Waitlist
            </button>
          </div>
        </main>

        <footer>
          <div className="footer-links center-links">
            <a href="#/terms">Terms</a>
            <a href="#/privacy">Privacy</a>
            <a href="mailto:solvers.real@gmail.com">Contact</a>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (currentHash === '#/terms') {
    return <Terms />;
  }
  
  if (currentHash === '#/privacy') {
    return <Privacy />;
  }

  return <Landing />;
}

export default App;
