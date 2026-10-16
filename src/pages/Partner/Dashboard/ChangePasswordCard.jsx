import React, { useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const inputClasses =
  'w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-sm';
const labelClasses = 'block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide';

const RESULT_MESSAGES = {
  wrong_password: 'Your current password is incorrect.',
  weak_password: 'The new password must be between 8 and 72 characters.',
  same_password: 'The new password must be different from the current one.',
  locked: 'Too many wrong attempts. Please try again in 15 minutes.',
  not_signed_in: 'Your session has expired. Please log out, log in again and retry.',
  no_partner: 'We could not find your restaurant account. Please log out and log in again.',
};

const ChangePasswordCard = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next.length < 8) {
      setError('The new password must be at least 8 characters long.');
      return;
    }
    if (next !== confirm) {
      setError('The new password and the confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('change_my_password', {
        p_current: current,
        p_new: next,
      });

      if (rpcError) throw rpcError;

      if (data === 'ok') {
        setSuccess('Password changed successfully. Other devices have been signed out.');
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        setError(RESULT_MESSAGES[data] || 'Could not change the password. Please try again.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('Could not change the password. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6"
    >
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2">
        <Lock size={15} className="text-orange-500" /> Change Password
      </h2>
      <p className="text-xs text-slate-500 mb-4">Use at least 8 characters. Do not reuse a password from another site.</p>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelClasses}>Current Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Confirm New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};

export default ChangePasswordCard;
