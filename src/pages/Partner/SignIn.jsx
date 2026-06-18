import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/Partner/AuthLayout';
import { supabase } from '../../supabaseClient';

// Utility function to hash password securely
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Hardcoded default values for easy testing
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Hash the password to match against the DB
      const hashedPassword = await hashPassword(credentials.password);

      // Query the partners table where email matches the input
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('email', credentials.identifier)
        .eq('password', hashedPassword)
        .single(); // we expect exactly one match

      if (error || !data) {
        throw new Error('Invalid email or password.');
      }

      // Save user session
      localStorage.setItem('partnerUser', JSON.stringify(data));
      
      // Check if profile setup is incomplete (e.g., missing opening_time)
      if (!data.opening_time) {
        navigate('/partner/setup-profile');
      } else {
        navigate('/partner/dashboard');
      }
      
    } catch (err) {
      console.error('Sign In Error:', err);
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Fuudr Partner | Grow Your Restaurant Revenue with Food Reels</title>
        <meta name="description" content="Join the Fuudr Partner Program. Reach more customers through video reels and get orders instantly. Log in to your restaurant dashboard." />
        <link rel="canonical" href="https://fuudr.com/partner" />
      </Helmet>
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to your partner dashboard to manage your business"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
          <div className="relative flex items-center group">
            <Mail className="absolute left-4 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300 pointer-events-none" size={20} />
            <input 
              type="email" 
              name="identifier"
              value={credentials.identifier}
              onChange={handleChange}
              className="w-full py-3.5 pl-12 pr-4 border border-slate-200/80 rounded-xl bg-slate-50/50 text-slate-900 transition duration-300 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:bg-slate-50" 
              placeholder="Enter your email address" 
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between ml-1">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <Link to="/partner/forgot-password" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">Forgot password?</Link>
          </div>
          <div className="relative flex items-center group">
            <Lock className="absolute left-4 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300 pointer-events-none" size={20} />
            <input 
              type="password" 
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full py-3.5 pl-12 pr-4 border border-slate-200/80 rounded-xl bg-slate-50/50 text-slate-900 transition duration-300 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:bg-slate-50" 
              placeholder="Enter your password" 
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-orange-500/25 mt-8 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? 'Signing In...' : 'Sign In'}
          {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have a partner account?{' '}
          <Link to="/partner/signup" className="text-orange-500 font-medium hover:text-orange-600 transition-colors">Register now</Link>
        </div>
      </form>
      </AuthLayout>
    </>
  );
};

export default SignIn;
