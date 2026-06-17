import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-900">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="email" 
              name="identifier"
              value={credentials.identifier}
              onChange={handleChange}
              className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
              placeholder="Enter your email address" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-900">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
            <input 
              type="password" 
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full py-3 pl-11 pr-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10" 
              placeholder="Enter your password" 
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 active:translate-y-0 hover:-translate-y-px transition-all shadow-[0_4px_6px_-1px_rgba(249,115,22,0.2)] hover:shadow-[0_6px_8px_-1px_rgba(249,115,22,0.3)] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
          {!loading && <ArrowRight size={20} />}
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have a partner account?{' '}
          <Link to="/partner/signup" className="text-orange-500 font-medium hover:text-orange-600 transition-colors">Register now</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
