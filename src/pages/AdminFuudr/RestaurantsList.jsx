import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Store, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  GraduationCap, 
  Star, 
  CheckCircle2, 
  ExternalLink,
  UtensilsCrossed,
  SlidersHorizontal,
  Building2
} from 'lucide-react';

export default function RestaurantsList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'poornima', 'regular', 'open'
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching partners:', error);
      } else {
        setRestaurants(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    const sub = supabase
      .channel('admin_partners_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchRestaurants)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Quick toggle is_poornima from Super Admin
  const handleTogglePoornima = async (partner) => {
    const newValue = !partner.is_poornima;
    setUpdatingId(partner.id);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_poornima: newValue })
        .eq('id', partner.id);

      if (error) throw error;

      setRestaurants(prev =>
        prev.map(r => (r.id === partner.id ? { ...r, is_poornima: newValue } : r))
      );
    } catch (err) {
      console.error('Failed to toggle is_poornima:', err);
      alert(err.message || 'Failed to update Poornima campus status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick toggle is_open from Super Admin
  const handleToggleOpen = async (partner) => {
    const newValue = partner.is_open === false ? true : false;
    setUpdatingId(partner.id);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_open: newValue })
        .eq('id', partner.id);

      if (error) throw error;

      setRestaurants(prev =>
        prev.map(r => (r.id === partner.id ? { ...r, is_open: newValue } : r))
      );
    } catch (err) {
      console.error('Failed to toggle open status:', err);
      alert(err.message || 'Failed to update open status');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    const total = restaurants.length;
    const poornima = restaurants.filter(r => r.is_poornima).length;
    const regular = total - poornima;
    const open = restaurants.filter(r => r.is_open !== false).length;
    return { total, poornima, regular, open };
  }, [restaurants]);

  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      // Filter tab
      if (filterType === 'poornima' && !r.is_poornima) return false;
      if (filterType === 'regular' && r.is_poornima) return false;
      if (filterType === 'open' && r.is_open === false) return false;

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.restaurant_name?.toLowerCase().includes(q) ||
        r.owner_name?.toLowerCase().includes(q) ||
        r.mobile_number?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.restaurant_type?.toLowerCase().includes(q)
      );
    });
  }, [restaurants, filterType, search]);

  return (
    <div className="font-outfit space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Restaurant Partners</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage onboarding, on-campus status, and operational details of all partner outlets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); fetchRestaurants(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Store size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400">Total Outlets</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : counts.total}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Registered Partners</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-100 p-5 flex flex-col gap-3 shadow-sm ring-1 ring-purple-100/50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">On Campus</span>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-700">{loading ? '—' : counts.poornima}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Inside Poornima Cafes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Accepting Orders</span>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">{loading ? '—' : counts.open}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Currently Open</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400">Off-Campus</span>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600">{loading ? '—' : counts.regular}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Standard City Outlets</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, owner, phone, email, address, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Outlets ({counts.total})
          </button>
          <button
            onClick={() => setFilterType('poornima')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'poornima' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100/70'
            }`}
          >
            <GraduationCap size={14} />
            Inside Poornima ({counts.poornima})
          </button>
          <button
            onClick={() => setFilterType('regular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'regular' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Off-Campus ({counts.regular})
          </button>
          <button
            onClick={() => setFilterType('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'open' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Open Now ({counts.open})
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center">
          <Store size={44} className="text-slate-300 mb-3" />
          <p className="font-bold text-slate-700 text-lg">No restaurant partners found</p>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">No restaurants match your active filter or search keyword.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Restaurant</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Owner & Contact</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Address & Location</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Operating Hours</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(partner => {
                  const isUpdating = updatingId === partner.id;
                  const isOpen = partner.is_open !== false;
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Restaurant Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={partner.restaurant_name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
                              {partner.restaurant_name?.charAt(0) || 'R'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{partner.restaurant_name}</span>
                              {partner.is_poornima && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  <GraduationCap size={11} /> Inside Poornima
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="capitalize">{partner.restaurant_type || 'Restaurant'}</span>
                              {partner.avg_rating > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                                    <Star size={11} className="fill-amber-400 text-amber-400" />
                                    {partner.avg_rating}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{partner.owner_name || '—'}</div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-500">
                          {partner.mobile_number && (
                            <a href={`tel:${partner.mobile_number}`} className="flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                              <Phone size={12} className="text-slate-400" /> {partner.mobile_number}
                            </a>
                          )}
                          {partner.email && (
                            <a href={`mailto:${partner.email}`} className="flex items-center gap-1.5 hover:text-orange-600 transition-colors truncate max-w-[170px]">
                              <Mail size={12} className="text-slate-400" /> {partner.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Address & Location */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 max-w-[220px] line-clamp-2">
                          {partner.address || '—'}
                        </div>
                        {partner.google_map_link && (
                          <a
                            href={partner.google_map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 mt-1"
                          >
                            <MapPin size={11} /> View on Map <ExternalLink size={10} />
                          </a>
                        )}
                      </td>

                      {/* Operating Hours */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {partner.opening_time && partner.closing_time ? (
                            <span>{partner.opening_time} - {partner.closing_time}</span>
                          ) : (
                            <span className="text-slate-400">Not configured</span>
                          )}
                        </div>
                        {partner.operating_days && partner.operating_days.length > 0 && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {partner.operating_days.length === 7 ? 'All 7 Days' : `${partner.operating_days.length} days/week`}
                          </div>
                        )}
                      </td>

                      {/* Live Open/Closed Status */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleOpen(partner)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isOpen 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          } ${isUpdating ? 'opacity-50' : ''}`}
                          title="Click to toggle restaurant open/closed status"
                        >
                          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isOpen ? 'Open' : 'Closed'}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Showing {filtered.length} of {restaurants.length} restaurant partners</span>
          </div>
        </div>
      )}

    </div>
  );
}
