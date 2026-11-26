import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Loader2, RotateCcw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import Settings from '../Partner/Dashboard/Settings';

export default function RestaurantAdminSettings() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspendSaving, setSuspendSaving] = useState(false);
  const [suspendError, setSuspendError] = useState('');
  const [confirmationAction, setConfirmationAction] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchRestaurant = async () => {
      setLoading(true);
      setError('');
      try {
        const [{ data: partnerData, error: partnerError }, { data: rpcData }] = await Promise.all([
          supabase
            .from('partners')
            .select('*')
            .eq('id', id)
            .maybeSingle(),
          supabase
            .rpc('admin_list_partners')
            .eq('id', id)
            .maybeSingle(),
        ]);

        if (partnerError && !rpcData) throw partnerError;

        const merged = { ...(rpcData || {}), ...(partnerData || {}) };
        if (!merged.id) {
          throw new Error('Restaurant not found.');
        }

        if (active) setRestaurant(merged);
      } catch (fetchError) {
        if (active) setError(fetchError.message || 'Unable to load this restaurant.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRestaurant();
    return () => { active = false; };
  }, [id]);

  const confirmSuspensionChange = async () => {
    const nextValue = confirmationAction === 'suspend';
    setSuspendSaving(true);
    setSuspendError('');
    try {
      const { error: updateError } = await supabase
        .from('partners')
        .update({ is_temporarily_suspended: nextValue })
        .eq('id', id);
      if (updateError) throw updateError;
      setRestaurant(current => ({ ...current, is_temporarily_suspended: nextValue }));
      setConfirmationAction(null);
    } catch (updateError) {
      setSuspendError(updateError.message || 'Unable to update suspension status.');
    } finally {
      setSuspendSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" aria-label="Loading" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="font-bold text-slate-800">{error || 'Restaurant not found.'}</p>
        <Link to="/adminfuudr/restaurants" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600">
          <ArrowLeft size={16} /> Back to Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Settings</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Restaurant Settings</h1>
          <p className="text-sm font-medium text-slate-500">
            Manage profile details, operating hours, and documents for this restaurant.
          </p>
        </div>
      </div>

      {/* ── Admin Suspension Control ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                  restaurant.is_temporarily_suspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {restaurant.is_temporarily_suspended ? 'Suspended' : 'Active'}
              </span>
              <p className="text-sm font-bold text-slate-800">Temporary Feed Suspension</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {restaurant.is_temporarily_suspended
                ? 'This restaurant is currently hidden from discovery reels. Search results remain available.'
                : 'This restaurant is actively visible in discovery reels.'}
            </p>
            {suspendError && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{suspendError}</p>}
          </div>
          <button
            type="button"
            onClick={() => setConfirmationAction(restaurant.is_temporarily_suspended ? 'restore' : 'suspend')}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${
              restaurant.is_temporarily_suspended
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {restaurant.is_temporarily_suspended ? <RotateCcw size={14} /> : <Ban size={14} />}
            {suspendSaving ? 'Saving…' : restaurant.is_temporarily_suspended ? 'Restore Visibility' : 'Suspend from Reels'}
          </button>
        </div>
      </div>

      {/* ── Partner Settings Component (Basic Profile, Hours, Docs) ── */}
      <Settings
        user={restaurant}
        onUserUpdated={(updated) => setRestaurant((prev) => ({ ...prev, ...updated }))}
        showChangePassword={false}
      />

      {/* ── Suspension Modal ── */}
      {confirmationAction && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !suspendSaving) setConfirmationAction(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspension-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <h2 id="suspension-confirm-title" className="text-lg font-black text-slate-900">
              {confirmationAction === 'suspend' ? 'Suspend this restaurant?' : 'Restore this restaurant?'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {confirmationAction === 'suspend'
                ? 'Its reels will be hidden from discovery. The restaurant can remain available in search.'
                : 'Its reels will be eligible to appear in discovery again.'}
            </p>
            {suspendError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{suspendError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmationAction(null);
                  setSuspendError('');
                }}
                disabled={suspendSaving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSuspensionChange}
                disabled={suspendSaving}
                className={`rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                  confirmationAction === 'suspend' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {suspendSaving ? 'Saving…' : confirmationAction === 'suspend' ? 'Confirm suspend' : 'Confirm restore'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
