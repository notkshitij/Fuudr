import React from 'react';
import './WaitlistFooter.css';

export const WaitlistFooter = () => {
  return (
    <>
      <section className="waitlist" id="waitlist">
        <h2>the future of food is <span className="it">here.</span><br/>request <span className="it">early access.</span></h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const btn = e.target.querySelector('button');
          if (btn) btn.textContent = 'joined';
        }}>
          <input type="email" placeholder="your email address" required />
          <button type="submit">join</button>
        </form>
        <div className="meta">2,400+ foodies already on the list</div>
      </section>

      <footer>
        <div>© 2026 fuudr · made hungry</div>
        <div className="links">
          <a href="https://www.linkedin.com/company/tryfuudr/" target="_blank" rel="noopener noreferrer">linkedin</a>
          <a href="https://www.instagram.com/tryfuudr/" target="_blank" rel="noopener noreferrer">instagram</a>
          <a href="https://whatsapp.com/channel/0029VbCTk553QxS6ZxDutH1N" target="_blank" rel="noopener noreferrer">whatsapp</a>
        </div>
      </footer>
    </>
  );
};
