import { locationAge } from './utils/locationAge';
import RiderMap from './components/RiderMap';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function RiderLocations() {
  const [riders, setRiders] = useState([]);
  const [checkedAt, setCheckedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let timer;
    async function refresh() {
      const { data, error: requestError } = await supabase.rpc('admin_rider_locations');
      if (!active) return;
      setError(requestError?.message ?? '');
      if (!requestError) setRiders(data ?? []);
      setLoading(false);
      setCheckedAt(Date.now());
      timer = setTimeout(refresh, 15000);
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, []);

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-black text-slate-900">Delivery Partners</h1>
      <p className="text-sm text-slate-600">Latest locations shared by approved riders. Updates every 15 seconds.</p>
      {loading && <p role="status">Loading delivery partners…</p>}
      {error && <p role="alert" className="text-red-700">Could not refresh rider locations. {error}</p>}
      {!loading && !error && riders.length === 0 && <p>No approved riders yet.</p>}
      <RiderMap riders={riders} checkedAt={checkedAt} />
      <ul className="grid gap-4 md:grid-cols-2">
        {riders.map((rider) => {
          const hasLocation = rider.latitude != null && rider.longitude != null;
          const fix = rider.position_timestamp ? new Date(rider.position_timestamp) : null;
          const recent = rider.tracking_active && fix && checkedAt - fix.getTime() < 120000;
          return (
            <li key={rider.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold text-slate-900">{rider.full_name || 'Unnamed rider'}</h2>
              <p className="text-sm text-slate-600">{hasLocation ? (recent ? 'Recent location' : 'Last known location') : 'No location shared'}</p>
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
