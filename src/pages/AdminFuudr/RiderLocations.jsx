import { Route } from 'lucide-react';
import { distanceKm, restaurantLocation } from './utils/restaurantLocation';
import { locationAge } from './utils/locationAge';
import RiderMap from './components/RiderMap';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function RiderLocations() {
  const [riders, setRiders] = useState([]);
  const [query, setQuery] = useState('');
  const [checkedAt, setCheckedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let timer;
    let inFlight = false;
    async function refresh(manual = false) {
      if (!active || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      if (manual) setSyncing(true);
      try {
        const { data, error: requestError } = await supabase.rpc('admin_rider_locations');
        if (!active) return;
        if (requestError) throw requestError;
        setRiders(data ?? []);
        setError('');
      } catch (cause) {
        if (active) setError(cause?.message || 'Please try again.');
      } finally {
        inFlight = false;
        if (active) {
          setLoading(false);
          setSyncing(false);
          setCheckedAt(Date.now());
          timer = setTimeout(refresh, 15000);
        }
      }
    }
    refreshRef.current = refresh;
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
      refreshRef.current = null;
    };
  }, []);

  const search = query.trim();
  const restaurant = restaurantLocation(search);
  const isRecent = (rider) => {
    const age = checkedAt - Date.parse(rider.position_timestamp);
    return rider.tracking_active && Number.isFinite(rider.latitude)
      && Number.isFinite(rider.longitude) && age < 120000;
  };
  const nearbyRiders = restaurant ? riders.filter(isRecent)
    .map((rider) => ({ ...rider, distance: distanceKm(restaurant, rider) }))
    .sort((a, b) => a.distance - b.distance) : [];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-slate-900">Delivery Partners</h1>
        <button type="button" disabled={loading || syncing} onClick={() => void refreshRef.current?.(true)}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-50">
          {syncing ? 'Syncing locations…' : 'Sync locations'}
        </button>
      </div>
      <p className="text-sm text-slate-600">Latest locations shared by approved riders. Updates every 15 seconds.</p>
      {loading && <p role="status">Loading delivery partners…</p>}
      {error && <p role="alert" className="text-red-700">Could not refresh rider locations. {error}</p>}
      {!loading && !error && riders.length === 0 && <p>No approved riders yet.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <input type="search" aria-label="Restaurant location" placeholder="Paste a Google Maps link or coordinates"
            value={query} onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-slate-300 lg:max-w-[80%] bg-white px-5 py-3 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200" />
          <div className="min-h-48 flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            {search && !restaurant && <p className="text-sm text-slate-600">Open the restaurant in Google Maps and copy the full link after it expands, or paste its latitude and longitude.</p>}
            {restaurant && <>
              <h2 className="mb-3 font-bold text-slate-900">Nearest riders</h2>
              {nearbyRiders.length === 0 && <p className="text-sm text-slate-600">No riders with a recent location.</p>}
              <ul className="grid gap-2">
                {nearbyRiders.map((rider) => (
                  <li key={rider.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{rider.full_name || 'Unnamed rider'}</p>
                      <p className="text-slate-600">{rider.distance.toFixed(1)} km straight-line · {locationAge(rider.position_timestamp, checkedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        aria-label="Open directions from rider to restaurant in Google Maps"
                        title="Open directions in Google Maps"
                        className="rounded-full p-2 text-orange-700 hover:bg-orange-50"
                        href={`https://www.google.com/maps/dir/?${new URLSearchParams({
                          api: '1',
                          origin: `${rider.latitude},${rider.longitude}`,
                          destination: `${restaurant.latitude},${restaurant.longitude}`,
                        })}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Route size={18} aria-hidden="true" />
                      </a>
                      {rider.phone && <a className="font-semibold text-orange-700" href={`tel:${rider.phone.replace(/[^+0-9]/g, '')}`}>Call</a>}
                    </div>
                  </li>
                ))}
              </ul>
            </>}
          </div>
        </div>
        <div className="min-w-0 lg:pr-12">
          <RiderMap riders={riders} checkedAt={checkedAt} restaurant={restaurant} closestRider={nearbyRiders[0]} />
        </div>
      </div>
      <ul className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {riders.map((rider) => {
          const hasLocation = rider.latitude != null && rider.longitude != null;
          const fix = rider.position_timestamp ? new Date(rider.position_timestamp) : null;
          const recent = isRecent(rider);
          return (
            <li key={rider.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">{rider.full_name || 'Unnamed rider'}</h2>
              <p className="text-sm text-slate-600">{recent ? 'Recent location' : hasLocation ? 'Last known location · Confirm availability before assigning' : 'No location shared'}</p>
              {hasLocation && fix && <p className="text-sm text-slate-600">GPS fix {locationAge(rider.position_timestamp, checkedAt)} · {fix.toLocaleString()}</p>}
              <div className="flex flex-wrap gap-4">
                {rider.phone && <a className="font-semibold text-orange-700" href={`tel:${rider.phone.replace(/[^+0-9]/g, '')}`}>Call {rider.phone}</a>}
                {hasLocation && <a className="font-semibold text-orange-700" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${rider.latitude},${rider.longitude}`)}`}>Open location in Maps</a>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
