import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const isSignIn = location.pathname === '/signin';
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div className="h-screen w-full bg-[#FAFAFA] font-outfit text-slate-800 flex overflow-hidden">
      
      {/* 
        ========================================
        LEFT PANE - Cinematic Static Image
        ========================================
      */}
      <div className="hidden lg:flex flex-col relative w-[40%] h-[calc(100vh-2rem)] my-4 ml-4 rounded-[2.5rem] overflow-hidden shadow-2xl z-10 bg-slate-900">
        
        {/* Loading State */}
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mb-4 shadow-lg shadow-orange-500/20"></div>
            <span className="text-white/60 font-medium text-sm animate-pulse tracking-wide uppercase">Loading...</span>
          </div>
        )}

        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          onCanPlay={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 z-0 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Note: External stock video URLs block direct streaming. 
              To achieve TRUE 0-millisecond loading, place an MP4 file named "food-bg.mp4" in your "public" folder. */}
          <source src="/food-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3 text-white">
            <img src="/icon.png" alt="Fuudr" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="text-2xl font-black tracking-tight">Fuudr</span>
          </div>

          <div className="mb-10">
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
              Partner with the fastest growing delivery network.
            </h1>
            <p className="text-white/80 text-lg font-medium">
              Join thousands of restaurants scaling their revenue daily.
            </p>
          </div>
        </div>
      </div>

      {/* 
        ========================================
        RIGHT PANE - Scrolling pane, fixed card height
        ========================================
      */}
      <div className="w-full lg:w-[60%] h-full flex flex-col relative bg-white overflow-y-auto overflow-x-hidden scrollbar-none">
        
        {/* Centered Area */}
        <div className="flex-1 flex justify-center items-center p-6 lg:p-10 w-full min-h-max bg-[#FAFAFA]">
          
          {/* Card (No internal scrollbar) */}
          <div className="w-full max-w-xl bg-white p-8 lg:p-12 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100/80 m-auto relative overflow-hidden group transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            
            {/* Subtle top highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="mb-10 text-center relative z-10">
              <h2 className="text-3xl lg:text-4xl font-black mb-3 text-slate-900 tracking-tight">{title}</h2>
              <p className="text-slate-500 font-medium text-lg">{subtitle}</p>
            </div>
            
            <div className="relative z-10">
              {/* The child form injected here */}
              {children}
            </div>
            
          </div>
        </div>

      </div>

      {/* Global style to completely hide the scrollbar while keeping scroll functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default AuthLayout;
