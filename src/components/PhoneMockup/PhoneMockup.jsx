import React from 'react';
import { Bookmark, Share2, MessageCircle, Volume2, ShoppingCart, Menu, Star, MapPin } from 'lucide-react';
import './PhoneMockup.css';

export const PhoneMockup = () => {
  return (
    <section className="phone-scroll">
      <div className="phone-sticky">
        <div className="phone-mockup">
          <div className="phone-screen">
            <video className="reel-video" autoPlay loop muted playsInline>
              <source src="/reel.mp4" type="video/mp4" />
            </video>
            <div className="phone-ui">

              <div className="phone-side-actions">
                <div className="phone-action"><Bookmark size={24} /><span className="label">Save</span></div>
                <div className="phone-action"><MessageCircle size={24} /><span className="label">124</span></div>
                <div className="phone-action"><Share2 size={24} /><span className="label">Share</span></div>
                <div className="phone-action"><Volume2 size={24} /><span className="label">Sound</span></div>
              </div>

              <div className="info">
                <div className="restaurant-info">
                  <div className="r-head">
                    <div className="r-name">Burger Boss</div>
                    <div className="r-rating"><Star size={12} fill="#FFB800" color="#FFB800" /> 4.8</div>
                  </div>
                  <div className="r-dish">The Double Smash</div>
                  <div className="r-loc"><MapPin size={12} /> Jaipur, Rajasthan</div>
                </div>
                <div className="phone-ctas">
                  <button className="order cart"><ShoppingCart size={16}/> Add to cart</button>
                  <button className="order menu"><Menu size={16}/> Menu</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
