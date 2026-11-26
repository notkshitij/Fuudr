import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Clock, ExternalLink, GraduationCap, Loader2, Mail, MapPin, Phone, Star, Ban, RotateCcw } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not provided';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {Icon && <Icon size={14} />}{label}
      </div>
      <div className="break-words text-sm font-semibold text-slate-800">{displayValue(value)}</div>
    </div>
  );
}

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
        const [{ data, error: fetchError }, { data: suspension, error: suspensionError }] = await Promise.all([
          supabase
            .rpc('admin_list_partners')
            .eq('id', id)
            .maybeSingle(),
          supabase
            .from('partners')
            .select('is_temporarily_suspended')
            .eq('id', id)
            .maybeSingle(),
        ]);
        if (fetchError) throw fetchError;
        if (suspensionError) throw suspensionError;
        if (active) setRestaurant(data ? { ...data, ...suspension } : null);
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
        <Link to="/adminfuudr/restaurants" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600"><ArrowLeft size={16} /> Back to Restaurants</Link>
      </div>
    );
  }

  const excluded = new Set([
    'restaurant_name', 'logo_url', 'owner_name', 'mobile_number', 'email', 'address',
    'google_map_link', 'opening_time', 'closing_time', 'operating_days', 'is_open',
    'is_poornima', 'avg_rating', 'restaurant_type', 'password', 'password_reset_required',
    'auth_user_id', 'is_temporarily_suspended',
  ]);
  const extraDetails = Object.entries(restaurant).filter(([key]) => !excluded.has(key) && key !== 'id');

  return (
    <div className="space-y-6 font-outfit">
      {/* Restaurant Info */}
      <div>
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">Restaurant information</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Owner" value={restaurant.owner_name} icon={Building2} />
          <Detail label="Phone" value={restaurant.mobile_number} icon={Phone} />
          <Detail label="Email" value={restaurant.email} icon={Mail} />
          <Detail label="Address" value={restaurant.address} icon={MapPin} />
          <Detail label="Operating hours" value={restaurant.opening_time && restaurant.closing_time ? `${restaurant.opening_time} – ${restaurant.closing_time}` : null} icon={Clock} />
          <Detail label="Operating days" value={restaurant.operating_days} icon={Clock} />
          <Detail label="Campus partner" value={restaurant.is_poornima} icon={GraduationCap} />
          <Detail label="Average rating" value={restaurant.avg_rating} icon={Star} />
          {restaurant.google_map_link && <div className="rounded-xl border border-slate-100 bg-white p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><MapPin size={14} />Map</div><a href={restaurant.google_map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">View on Google Maps <ExternalLink size={13} /></a></div>}
        </div>
      </div>

      {/* Additional Details */}
      {extraDetails.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">Additional details</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{extraDetails.map(([key, value]) => <Detail key={key} label={key.replace(/_/g, ' ')} value={value} />)}</div>
        </div>
      )}

      {/* Suspension */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-slate-700">Temporary feed suspension</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{restaurant.is_temporarily_suspended ? 'This restaurant is suspended from discovery.' : 'This restaurant is visible in discovery.'} Search results can remain available.</p>
          {suspendError && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{suspendError}</p>}
        </div>
        <button type="button" onClick={() => setConfirmationAction(restaurant.is_temporarily_suspended ? 'restore' : 'suspend')} className={`inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-bold text-white transition sm:self-auto ${restaurant.is_temporarily_suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
          {restaurant.is_temporarily_suspended ? <RotateCcw size={13} /> : <Ban size={13} />}
          {suspendSaving ? 'Saving…' : restaurant.is_temporarily_suspended ? 'Restore' : 'Suspend'}
        </button>
      </div>

      {confirmationAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !suspendSaving) setConfirmationAction(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="suspension-confirm-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 id="suspension-confirm-title" className="text-lg font-black text-slate-900">{confirmationAction === 'suspend' ? 'Suspend this restaurant?' : 'Restore this restaurant?'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{confirmationAction === 'suspend' ? 'Its reels will be hidden from discovery. The restaurant can remain available in search.' : 'Its reels will be eligible to appear in discovery again.'}</p>
            {suspendError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{suspendError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setConfirmationAction(null); setSuspendError(''); }} disabled={suspendSaving} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={confirmSuspensionChange} disabled={suspendSaving} className={`rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50 ${confirmationAction === 'suspend' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {suspendSaving ? 'Saving…' : confirmationAction === 'suspend' ? 'Confirm suspend' : 'Confirm restore'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
