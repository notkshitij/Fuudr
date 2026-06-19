import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Generates a session token so Google bills Autocomplete + Place Details
// together as ONE session instead of separate per-keystroke requests.
// (Cuts cost significantly — this matters once you're past free tier.)
function createSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * AddressAutocomplete
 * Restaurant/place address search box backed by Google Places API (New).
 * Calls onSelect({ address, latitude, longitude, placeId }) when the user
 * picks a suggestion. Does NOT allow free-typed address to be submitted —
 * forces a selection from Google so lat/lng is always captured.
 */
const AddressAutocomplete = ({
  value,
  onSelect,
  placeholder = 'Search your restaurant address...',
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(Boolean(value));
  const sessionTokenRef = useRef(createSessionToken());
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          },
          body: JSON.stringify({
            input: query,
            sessionToken: sessionTokenRef.current,
            // Bias results toward India since Fuudr operates locally
            regionCode: 'IN',
          }),
        }
      );
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Places autocomplete error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsConfirmed(false);
    onSelect({ address: '', latitude: null, longitude: null, placeId: null });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelectSuggestion = async (suggestion) => {
    const placeId = suggestion.placePrediction.placeId;
    const description = suggestion.placePrediction.text.text;

    setInputValue(description);
    setShowDropdown(false);
    setSuggestions([]);
    setLoading(true);

    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=location,formattedAddress&sessionToken=${sessionTokenRef.current}`,
        {
          headers: {
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          },
        }
      );
      const data = await res.json();

      if (data.location) {
        setIsConfirmed(true);
        onSelect({
          address: data.formattedAddress || description,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          placeId,
        });
      }
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setLoading(false);
      // New session token for the next search (session ends after Place Details call)
      sessionTokenRef.current = createSessionToken();
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          required={required}
          autoComplete="off"
          className={`w-full py-3 pl-11 pr-10 border rounded-lg bg-slate-50 text-slate-900 transition duration-200 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${
            isConfirmed ? 'border-green-300' : 'border-slate-200'
          }`}
          placeholder={placeholder}
        />
        {loading && (
          <Loader2 className="absolute right-4 text-slate-400 animate-spin" size={18} />
        )}
        {!loading && isConfirmed && (
          <span className="absolute right-4 text-green-500 text-xs font-semibold">✓</span>
        )}
      </div>

      {!isConfirmed && inputValue.length > 0 && (
        <p className="mt-1.5 text-xs text-amber-600">
          Please select an address from the suggestions list below.
        </p>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden z-30 max-h-72 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.placePrediction.placeId}
              onClick={() => handleSelectSuggestion(s)}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-b-0 flex items-start gap-2"
            >
              <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                {s.placePrediction.text.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
