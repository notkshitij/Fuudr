import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Eye, Search, Filter, Package, Clock, Bike, CheckCircle, RefreshCw, GraduationCap, Trash2, X, Loader2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  all:        { label: 'All Orders',  color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  placed:     { label: 'Placed',      color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-500',   icon: Package },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-500',   icon: Clock },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',     dot: 'bg-blue-500',    icon: Bike },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',   color: 'text-rose-700',    bg: 'bg-rose-50',     dot: 'bg-rose-500',    icon: CheckCircle },
};

const TODAY = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

export default function OrdersList() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('all'); // 'all', 'poornima_only'
  const [activeTab, setActiveTab] = useState('all');
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const navigate = useNavigate();

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const leadingDays = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(leadingDays).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);

  const dateKey = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Delete blocked by Supabase RLS policy! 0 rows were deleted. Please run the SQL snippet shown below in your Supabase SQL Editor to allow DELETE operations.");
      }

      setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
      setDeleteError(err.message || 'Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelOrderFallback = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderToDelete.id);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderToDelete.id ? { ...o, status: 'cancelled' } : o));
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setDeleteError(err.message || 'Failed to cancel order.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchOrders = async () => {
    let ordersData = null;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        partners!orders_partner_id_fkey (
          restaurant_name,
          is_poornima
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      ordersData = data.map(o => ({
        ...o,
        restaurant_name: o.partners?.restaurant_name ?? o.restaurant_name,
        is_poornima: o.partners?.is_poornima ?? o.is_poornima ?? false
      }));
    } else if (error) {
      console.warn('Orders joined query failed in OrdersList:', error.message, 'Trying plain select...');
      const plain = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!plain.error && plain.data) {
        ordersData = plain.data;
      } else if (plain.error) {
        console.error('Plain orders query failed:', plain.error.message);
      }
    }

    if (ordersData) {
      setOrders(ordersData);
    }
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

  useEffect(() => {
    const closeCalendar = () => setCalendarOpen(false);
    window.addEventListener('click', closeCalendar);
    return () => window.removeEventListener('click', closeCalendar);
  }, []);

  // Tab counts
  const counts = useMemo(() => {
    const c = { all: orders.length, placed: 0, preparing: 0, on_the_way: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [orders]);

  const poornimaOrderCount = useMemo(() => {
    return orders.filter(o => o.is_poornima).length;
  }, [orders]);

  // Filtered list
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchTab = activeTab === 'all' || o.status === activeTab;
      
      // Campus filter
      if (campusFilter === 'poornima_only' && !o.is_poornima) return false;

      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.delivery_name?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        o.restaurant_name?.toLowerCase().includes(q);
      
      let matchDate = true;
      if (dateFilter) {
        const localDateParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(o.created_at));
        matchDate = localDateParts === dateFilter;
      }

      return matchTab && matchSearch && matchDate;
    });
  }, [orders, activeTab, campusFilter, search, dateFilter]);

  const activeOrders = counts.placed + counts.preparing + counts.on_the_way;

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
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1 basis-[180px]">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Order ID, customer, restaurant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-11 w-full pl-11 pr-4 bg-white border border-slate-200 rounded-[14px] text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
        {/* Date Filter */}
        <div className="relative h-11 w-28 sm:w-32 flex-shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setCalendarOpen(open => !open);
            }}
            className="absolute inset-0 flex items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-slate-200 bg-white px-3 text-slate-700 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          >
            <CalendarDays size={16} className="text-slate-500" />
            <span className="text-sm font-bold whitespace-nowrap">
              {!dateFilter
                ? 'Date'
                : dateFilter === TODAY
                  ? 'Today'
                  : new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </button>
          {calendarOpen && (
            <div
              onClick={(event) => event.stopPropagation()}
              className="absolute right-0 top-full z-40 mt-2 w-[280px] max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-3 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={17} />
                </button>
                <p className="text-sm font-black text-slate-800">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                  aria-label="Next month"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <span key={`${day}-${index}`} className="py-1 text-[10px] font-bold text-slate-400">{day}</span>
                ))}
                {calendarDays.map((day, index) => {
                  if (!day) return <span key={`empty-${index}`} />;
                  const key = dateKey(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                  const selected = dateFilter === key;
                  const today = TODAY === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setDateFilter(key);
                        setCalendarOpen(false);
                      }}
                      className={`h-8 rounded-md text-xs font-bold transition-colors ${
                        selected
                          ? 'bg-orange-500 text-white'
                          : today
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('');
                    setCalendarOpen(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  All dates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter(TODAY);
                    setCalendarMonth(new Date());
                    setCalendarOpen(false);
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  Today
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Campus Filter Toggle */}
        <button
          onClick={() => setCampusFilter(prev => prev === 'poornima_only' ? 'all' : 'poornima_only')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            campusFilter === 'poornima_only'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20'
              : 'bg-white border-slate-200 text-purple-700 hover:bg-purple-50 hover:border-purple-200'
          }`}
          title="Filter only orders from cafes inside Poornima campus"
        >
          <GraduationCap size={16} />
          <span>Inside Poornima</span>
          {poornimaOrderCount > 0 && (
            <span className={`text-xs px-1.5 py-0.2 rounded-full font-extrabold ${
              campusFilter === 'poornima_only' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'
            }`}>
              {poornimaOrderCount}
            </span>
          )}
        </button>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
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
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
                  const parts = order.id.split('-');
                  const displayId = parts[parts.length - 1].toUpperCase();

                  let items = [];
                  if (order.bill?.items && Array.isArray(order.bill.items)) {
                    items = order.bill.items.map(i => ({
                      dishName: i.name || i.dishName,
                      quantity: i.qty || i.quantity || 1,
                      price: i.price || 0,
                      isVeg: i.isVeg !== undefined ? i.isVeg : true
                    }));
                  } else if (Array.isArray(order.items)) {
                    items = order.items.map(i => ({
                      dishName: i.dishName || i.name,
                      quantity: i.quantity || i.qty || 1,
                      price: i.price || 0,
                      isVeg: i.isVeg !== undefined ? i.isVeg : true
                    }));
                  }

                  const preview = items.slice(0, 2).map(i => i.dishName).join(', ');
                  const extra = items.length > 2 ? ` +${items.length - 2}` : '';
                  const totalPrice = order.bill?.customer_total ?? order.bill?.total ?? order.total_price ?? 0;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          #{displayId}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{order.delivery_name || 'N/A'}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{order.delivery_address || '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm truncate max-w-[160px]">{order.restaurant_name || '—'}</div>
                        {order.is_poornima && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <GraduationCap size={10} /> Inside Poornima
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-600 max-w-[160px] truncate">{preview}{extra ? <span className="text-slate-400">{extra} more</span> : ''}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-black text-slate-900">₹{totalPrice}</span>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/adminfuudr/orders/${order.id}`)}
                            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-orange-500 transition-all shadow-sm"
                          >
                            <Eye size={13} /> Manage
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setOrderToDelete(order);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 transition-all shadow-sm group"
                            title="Delete Order"
                          >
                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
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

      {/* ── Delete Confirmation Modal ── */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative shadow-2xl border border-slate-100 animate-scaleUp">
            <button
              onClick={() => {
                if (!isDeleting) {
                  setOrderToDelete(null);
                  setDeleteError(null);
                }
              }}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={14} />
            </button>

            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3.5">
              <Trash2 size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Delete Order #{orderToDelete.id.split('-').pop().toUpperCase()}?
            </h3>

            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Are you sure you want to permanently delete this order for{' '}
              <strong className="text-slate-700">{orderToDelete.delivery_name || 'Customer'}</strong>
              {orderToDelete.restaurant_name ? ` from ${orderToDelete.restaurant_name}` : ''}? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
                <p>{deleteError}</p>
                <button
                  type="button"
                  onClick={handleCancelOrderFallback}
                  disabled={isDeleting}
                  className="w-full py-1.5 px-2 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition-colors"
                >
                  {isDeleting ? 'Updating...' : 'Mark as Cancelled Instead'}
                </button>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
