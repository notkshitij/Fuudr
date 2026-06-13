import React, { useEffect } from 'react';
import { SplitText } from '../SplitText';
import { Play, Compass, Zap, Coins, Smartphone, TrendingUp, ShieldCheck } from 'lucide-react';
import './FeaturesHorizontal.css';

export const FeaturesHorizontal = () => {
  useEffect(() => {
    const track = document.getElementById('htrack');
    if (!track) return;
    
    let isDown = false, startX, scrollLeftStart;
    
    const mouseDown = e => {
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeftStart = track.scrollLeft;
    };
    const mouseLeave = () => isDown = false;
    const mouseUp = () => isDown = false;
    const mouseMove = e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeftStart - (x - startX) * 1.5;
    };
    
    track.addEventListener('mousedown', mouseDown);
    track.addEventListener('mouseleave', mouseLeave);
    track.addEventListener('mouseup', mouseUp);
    track.addEventListener('mousemove', mouseMove);
    track.style.overflowX = 'auto';
    track.style.scrollbarWidth = 'none';

    return () => {
      track.removeEventListener('mousedown', mouseDown);
      track.removeEventListener('mouseleave', mouseLeave);
      track.removeEventListener('mouseup', mouseUp);
      track.removeEventListener('mousemove', mouseMove);
    };
  }, []);

  return (
    <>
      <section className="display">
        <h2><SplitText text="so we built " /><span className="it"><SplitText text="fuudr." /></span></h2>
      </section>

      <section className="h-section">
        <div className="head">
          <div className="label mono-label">— What fuudr brings</div>
          <h2>fuudr changes the <span className="it">game.</span></h2>
        </div>
        <div className="h-track" id="htrack">
          <div className="h-card">
            <img src="https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Kitchen" className="h-card-img" />
            <div className="card-head">
              <div className="num">01</div>
              <Play size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Authentic videos from actual kitchens</div>
            <div className="d">See exactly what the chef is preparing, with zero deceptive food styling. Just honest food.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Dish" className="h-card-img" />
            <div className="card-head">
              <div className="num">02</div>
              <Compass size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Merit-based restaurant discovery</div>
            <div className="d">Quality food travels further than ad budgets, giving hidden culinary gems the spotlight they deserve.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Order" className="h-card-img" />
            <div className="card-head">
              <div className="num">03</div>
              <Zap size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Seamless reel-to-checkout flow</div>
            <div className="d">Turn a craving into a confirmed order in three effortless taps, without ever switching apps.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Creator" className="h-card-img" />
            <div className="card-head">
              <div className="num">04</div>
              <Coins size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Fair monetization for creators</div>
            <div className="d">Creators earn a direct, transparent commission for every single order generated through their content.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Scrolling" className="h-card-img" />
            <div className="card-head">
              <div className="num">05</div>
              <Smartphone size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Intuitive social scrolling</div>
            <div className="d">Built around the engaging video feeds you already love, fully optimized for immediate checkout.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Restaurant" className="h-card-img" />
            <div className="card-head">
              <div className="num">06</div>
              <TrendingUp size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Organic reach for restaurants</div>
            <div className="d">Kitchens grow their business through mouth-watering content instead of expensive, unsustainable promotions.</div>
          </div>
          <div className="h-card">
            <img src="https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Food" className="h-card-img" />
            <div className="card-head">
              <div className="num">07</div>
              <ShieldCheck size={28} strokeWidth={1.5} color="#E94F1D" />
            </div>
            <div className="t">Absolute trust in every bite</div>
            <div className="d">What you see on the screen is exactly what arrives at your doorstep. No surprises, just great food.</div>
          </div>
        </div>
      </section>
    </>
  );
};
