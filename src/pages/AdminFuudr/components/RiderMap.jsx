import { locationAge } from '../utils/locationAge';
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '../utils/loadGoogleMapsScript';

export default function RiderMap({ riders, checkedAt }) {
  const container = useRef(null);
  const hasFit = useRef(false);
  const [runtime, setRuntime] = useState(null);
  const [error, setError] = useState('');
  const located = riders.filter(({ latitude, longitude }) =>
    Number.isFinite(latitude) && Number.isFinite(longitude));
  const hasLocations = located.length > 0;

  useEffect(() => {
    if (!hasLocations) return;
    let active = true;
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    async function initialize() {
      try {
        if (!key) throw new Error('Google Maps API key is missing.');
        const maps = await loadGoogleMapsScript(key);
        const { Map } = await maps.importLibrary('maps');
        const { AdvancedMarkerElement, PinElement } = await maps.importLibrary('marker');
        if (!active) return;
        const map = new Map(container.current, {
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          center: { lat: 26.91, lng: 75.79 },
          zoom: 12,
          streetViewControl: false,
        });
        setError('');
        setRuntime({ map, AdvancedMarkerElement, PinElement, LatLngBounds: maps.LatLngBounds });
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load Google Maps.');
      }
    }
    void initialize();
    return () => { active = false; hasFit.current = false; };
  }, [hasLocations]);

  useEffect(() => {
    if (!runtime || !located.length) return;
    const { map, AdvancedMarkerElement, PinElement, LatLngBounds } = runtime;
    const bounds = new LatLngBounds();
    const markers = located.map((rider) => {
      const position = { lat: rider.latitude, lng: rider.longitude };
      bounds.extend(position);
      const name = rider.full_name || 'Unnamed rider';
      const label = document.createElement('span');
      label.className = 'whitespace-nowrap rounded-full border-2 border-white bg-orange-700 px-3 py-1 text-sm font-bold text-white shadow-md';
      label.textContent = `${name} · ${locationAge(rider.position_timestamp, checkedAt)}`;
      const marker = new AdvancedMarkerElement({ map, position, title: name });
      const pin = new PinElement({ background: '#c2410c', borderColor: '#7c2d12', glyphColor: '#ffffff' });
      const content = document.createElement('div');
      content.className = 'flex flex-col items-center gap-1';
      content.append(label, pin);
      marker.append(content);
      return marker;
    });
    if (!hasFit.current) {
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 70);
      }
      hasFit.current = true;
    }
    return () => markers.forEach((marker) => { marker.map = null; });
  }, [runtime, located, checkedAt]);

  return (
    <div hidden={!hasLocations}>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div ref={container} aria-label="Map of delivery partners" className="h-[28rem] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" />
    </div>
  );
}
