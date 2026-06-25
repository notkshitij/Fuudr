import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Eye, Search, Filter, Package, Clock, Bike, CheckCircle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  all:        { label: 'All Orders',  color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  confirmed:  { label: 'Confirmed',   color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-500',   icon: Package },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   icon: Clock },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: Bike },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle },
};

export default function OrdersList() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const sub = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Tab counts
  const counts = useMemo(() => {
    const c = { all: orders.length, confirmed: 0, preparing: 0, on_the_way: 0, delivered: 0 };
    orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [orders]);

  // Filtered list
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchTab = activeTab === 'all' || o.status === activeTab;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.delivery_name?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        o.restaurant_name?.toLowerCase().includes(q);
      
      let matchDate = true;
      if (dateFilter) {
        // Handle timezone properly or just simple prefix match
        const orderDateStr = new Date(o.created_at).toISOString().split('T')[0];
        // However, localDate might be different. Let's use local timezone formatting to match input type="date"
        const localDateParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(o.created_at));
        // en-CA outputs YYYY-MM-DD
        matchDate = localDateParts === dateFilter;
      }

      return matchTab && matchSearch && matchDate;
    });
  }, [orders, activeTab, search, dateFilter]);

  const activeOrders = counts.confirmed + counts.preparing + counts.on_the_way;

  return (
    <div className="font-outfit space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Incoming Orders</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage and track all real-time delivery orders.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeOrders > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-100 px-4 py-2 rounded-xl font-bold text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              {activeOrders} Active
            </div>
          )}
          <button
            onClick={() => { setLoading(true); fetchOrders(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, order ID, address, restaurant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-500 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-0.5"
              title="Clear date filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
        {/* Status tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === key ? `${cfg.bg} ${cfg.color}` : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="hidden md:inline">{cfg.label}</span>
              <span className="text-xs opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <Package size={40} className="text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">No orders found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Restaurant</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const preview = items.slice(0, 2).map(i => i.dishName).join(', ');
                  const extra = items.length > 2 ? ` +${items.length - 2}` : '';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{order.delivery_name || 'N/A'}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{order.delivery_address || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{order.restaurant_name || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-600 max-w-[160px] truncate">{preview}{extra ? <span className="text-slate-400">{extra} more</span> : ''}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-black text-slate-900">₹{order.total_price}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/adminfuudr/orders/${order.id}`)}
                          className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-orange-500 transition-all"
                        >
                          <Eye size={13} /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Showing {filtered.length} of {orders.length} orders</span>
          </div>
        </div>
      )}
    </div>
  );
}
