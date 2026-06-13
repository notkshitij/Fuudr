import React from 'react';
import { SplitText } from '../SplitText';
import './WhatsBroken.css';

export const WhatsBroken = () => {
  return (
    <>
      <section className="display">
        <h2><SplitText text="rethinking " /><span className="it"><SplitText text="food." /></span></h2>
      </section>

      <section className="numbered">
        <div className="intro">
          <div className="mono-label">— What's broken</div>
          <p>Traditional food delivery platforms paved the way, but the discovery experience has remained stagnant. We recognized the widening gap between how you find great food and how you actually order it.</p>
        </div>
        <div className="num-row">
          <div className="n">01</div>
          <div className="t">Static, heavily-edited photos that rarely match the actual dish delivered to you</div>
          <div className="num-imgs">
            <img src="https://images.pexels.com/photos/1633525/pexels-photo-1633525.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Burger" />
            <img src="https://images.pexels.com/photos/2983099/pexels-photo-2983099.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Burger 2" />
            <img src="https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Burger 3" />
          </div>
        </div>
        <div className="num-row">
          <div className="n">02</div>
          <div className="t">Discovery feeds dominated by algorithmic ad spending rather than culinary quality</div>
          <div className="num-imgs">
            <img src="https://images.pexels.com/photos/5053740/pexels-photo-5053740.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Phone" />
            <img src="https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Phone 2" />
            <img src="https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=200" alt="App" />
          </div>
        </div>
        <div className="num-row">
          <div className="n">03</div>
          <div className="t">Exceptional local kitchens struggling for visibility against massive restaurant chains</div>
          <div className="num-imgs">
            <img src="https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Kitchen" />
            <img src="https://images.pexels.com/photos/2290753/pexels-photo-2290753.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Chef" />
            <img src="https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Cooking" />
          </div>
        </div>
        <div className="num-row">
          <div className="n">04</div>
          <div className="t">Food creators driving immense restaurant traffic without fair monetization</div>
          <div className="num-imgs">
            <img src="https://images.pexels.com/photos/1051544/pexels-photo-1051544.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Creator" />
            <img src="https://images.pexels.com/photos/3756523/pexels-photo-3756523.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Camera" />
            <img src="https://images.pexels.com/photos/2180875/pexels-photo-2180875.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Phone picture" />
          </div>
        </div>
        <div className="num-row">
          <div className="n">05</div>
          <div className="t">The frustrating friction between discovering food on social media and searching for it on delivery apps</div>
          <div className="num-imgs">
            <img src="https://images.pexels.com/photos/3782229/pexels-photo-3782229.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Frustrated" />
            <img src="https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Phone scroll" />
            <img src="https://images.pexels.com/photos/4353608/pexels-photo-4353608.jpeg?auto=compress&cs=tinysrgb&w=200" alt="Confused" />
          </div>
        </div>
      </section>
    </>
  );
};
