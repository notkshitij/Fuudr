import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const isSignIn = location.pathname === '/signin';

  return (
    <div className="h-screen w-full bg-[#FAFAFA] font-outfit text-slate-800 flex overflow-hidden">
      
      {/* 
        ========================================
        LEFT PANE - Cinematic Static Image
        ========================================
      */}
      <div className="hidden lg:flex flex-col relative w-[40%] h-[calc(100vh-2rem)] my-4 ml-4 rounded-[2.5rem] overflow-hidden shadow-2xl z-10">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Delicious Food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
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
          <div className="w-full max-w-xl bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-slate-100 m-auto">
            
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black mb-2 text-slate-900">{title}</h2>
              <p className="text-slate-500 font-medium">{subtitle}</p>
            </div>
            
            {/* The child form injected here */}
            {children}
            
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
