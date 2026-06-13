import React from 'react';
import './WhyFuudr.css';

export const WhyFuudr = () => {
  return (
    <>
      <section className="pin-section">
        <div className="grid">
          <div className="label mono-label">— Why fuudr?</div>
          <h2 className="scroll-reveal-text">
            {"The era of guessing your meal is over. We are replacing static menus with authentic video experiences. See the sizzle, explore the texture, and order with complete confidence. Welcome to the future of food discovery.".split(' ').map((w, i) => (
              <React.Fragment key={i}><span className="w">{w}</span> </React.Fragment>
            ))}
          </h2>
        </div>
      </section>

      <div className="cols">
        <div className="label-col"></div>
        <div className="col">
          <h3>Order what you actually see</h3>
          <p>Static photos can't show texture, sizzle, or steam. Video can. Watch your food being prepared before it even leaves the kitchen, and decide with your eyes wide open.</p>
        </div>
        <div className="col">
          <h3>Discover beyond the algorithm</h3>
          <p>Great kitchens exist on every street, but traditional listing apps bury them under paid placements. Reels surface authentic food from passionate chefs who actually cook it.</p>
        </div>
        <div className="col">
          <h3>Make creators part of the meal</h3>
          <p>Food creators drive millions in restaurant sales and earn nothing. On fuudr, every order they inspire pays them a fair commission. Real impact, real earnings.</p>
        </div>
      </div>
    </>
  );
};
