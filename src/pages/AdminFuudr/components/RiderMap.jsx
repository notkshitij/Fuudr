import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { locationAge } from '../utils/locationAge';

export default function RiderMap({ riders, checkedAt, restaurant, closestRider }) {
  const container = useRef(null);
  const fittedMap = useRef(null);
  const [runtime, setRuntime] = useState(null);
  const [error, setError] = useState('');
  const hasLocations = Boolean(restaurant) || riders.some(({ latitude, longitude }) =>
    Number.isFinite(latitude) && Number.isFinite(longitude));

  useEffect(() => {
    if (!hasLocations) return;
    let active = true;
    let map;
    async function initialize() {
      try {
        const { default: L } = await import('leaflet');
        if (!active) return;
        map = L.map(container.current, { scrollWheelZoom: true, touchZoom: true }).setView([26.91, 75.79], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).on('tileerror', () => setError('Map tiles are temporarily unavailable.'))
          .on('tileload', () => setError('')).addTo(map);
        const icon = L.icon({
          iconUrl: markerIcon, iconRetinaUrl: markerIconRetina, shadowUrl: markerShadow,
          iconSize: [25, 41], iconAnchor: [12, 41], tooltipAnchor: [0, -41], shadowSize: [41, 41],
        });
        setError('');
        setRuntime({ L, map, icon, markers: L.layerGroup().addTo(map) });
      } catch {
        if (active) setError('Could not load the rider map.');
      }
    }
    void initialize();
    return () => { active = false; map?.remove(); };
  }, [hasLocations]);

  useEffect(() => {
    if (!runtime || !hasLocations || runtime.map.getContainer() !== container.current) return;
    const { L, map, icon, markers } = runtime;
    const bounds = L.latLngBounds([]);
    markers.clearLayers();
    for (const rider of riders) {
      if (!Number.isFinite(rider.latitude) || !Number.isFinite(rider.longitude)) continue;
      const position = [rider.latitude, rider.longitude];
      bounds.extend(position);
      const name = rider.full_name || 'Unnamed rider';
      const label = document.createElement('span');
      label.textContent = `${name} · ${locationAge(rider.position_timestamp, checkedAt)}`;
      L.marker(position, { icon, title: name, alt: name })
        .bindTooltip(label, { permanent: true, direction: 'top' }).addTo(markers);
    }
    let focusKey = 'all-riders';
    if (restaurant) {
      const position = [restaurant.latitude, restaurant.longitude];
      L.circleMarker(position, {
        radius: 9, color: '#fff', weight: 2, fillColor: '#ea580c', fillOpacity: 1,
      }).bindTooltip('Restaurant', { permanent: true, direction: 'top', offset: [0, -9] })
        .addTo(markers);
      focusKey = JSON.stringify([position, closestRider?.id]);
      if (fittedMap.current?.map !== map || fittedMap.current.key !== focusKey) {
        if (closestRider) {
          map.fitBounds([position, [closestRider.latitude, closestRider.longitude]], {
            padding: [55, 55], maxZoom: 16,
          });
        } else {
          map.setView(position, 16);
        }
      }
    } else if (fittedMap.current?.map !== map || fittedMap.current.key !== focusKey) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
    fittedMap.current = { map, key: focusKey };
  }, [runtime, hasLocations, riders, checkedAt, restaurant, closestRider]);

  if (!hasLocations) return null;
  return (
    <div className="ml-auto w-full max-w-[calc(24rem+4cm)]">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div ref={container} aria-label="Map of delivery partners" className="isolate aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" />
    </div>
  );
}
