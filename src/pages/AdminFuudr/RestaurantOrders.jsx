import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ACTIVE_ORDER_STATUSES, getOrderType, orderDateKey } from './utils/orderOverview';
import {
  Search,
  Package,
  Clock,
  Bike,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Zap,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  all:        { label: 'All Orders',  color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  active:     { label: 'Active',      color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  placed:     { label: 'Placed',      color: 'text-slate-700',   bg: 'bg-slate-100',  dot: 'bg-slate-500',   icon: Package },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500',   icon: Clock },
  prepared:   { label: 'Prepared',    color: 'text-violet-700',  bg: 'bg-violet-50',  dot: 'bg-violet-500',  icon: CheckCircle },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: Bike },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',   color: 'text-rose-700',    bg: 'bg-rose-50',    dot: 'bg-rose-500',    icon: CheckCircle },
};

const ORDER_KPIS = [
  { status: 'all', icon: ShoppingBag, accent: 'bg-orange-50 text-orange-700' },
  { status: 'active', icon: Zap, accent: 'bg-blue-50 text-blue-700' },
  { status: 'delivered', icon: CheckCircle, accent: 'bg-emerald-50 text-emerald-700' },
  { status: 'cancelled', icon: XCircle, accent: 'bg-rose-50 text-rose-700' },
];

const ORDER_TYPE_CONFIG = {
  delivery: {
    label: 'Delivery',
    row: 'bg-sky-50 hover:bg-sky-100',
    badge: 'bg-sky-100 text-sky-800',
  },
  pickup: {
    label: 'Pickup',
    row: 'bg-amber-50 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-900',
  },
};

const getCustomerKey = (order) => {
  const customerId = order.customer_id ?? order.user_id ?? order.profile_id;
  if (customerId) return `id:${customerId}`;
  const mobileNumber = String(order.mobile_no ?? '').replace(/\D/g, '');
  return mobileNumber ? `mobile:${mobileNumber.slice(-10)}` : null;
};

const markFirstOrders = (orders) => {
  const firstOrderByCustomer = new Map();
  [...orders]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach((order) => {
      const customerKey = getCustomerKey(order);
      if (customerKey && !firstOrderByCustomer.has(customerKey)) {
        firstOrderByCustomer.set(customerKey, order.id);
      }
    });

  return orders.map((order) => {
    const customerKey = getCustomerKey(order);
    return {
      ...order,
      is_first_order: customerKey
        ? firstOrderByCustomer.get(customerKey) === order.id
        : false,
    };
  });
};

export default function RestaurantOrders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [filters, setFilters] = useSearchParams();

  const statusFilter = filters.get('status');
  const activeTab = Object.hasOwn(STATUS_CONFIG, statusFilter) ? statusFilter : 'all';
  const requestedDate = filters.get('date') || '';
  const dateFilter =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    orderDateKey(`${requestedDate}T00:00:00+05:30`) === requestedDate
      ? requestedDate
      : '';

  const [now, setNow] = useState(Date.now);
  const todayKey = orderDateKey(now);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(filters);
    if (value) next.set(key, value);
    else next.delete(key);
    setFilters(next);
  };

  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(`${dateFilter || todayKey}T00:00:00`));

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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(markFirstOrders(data));
      }
    } catch (err) {
      console.error('Failed to load restaurant orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOrders();
    const refreshInterval = window.setInterval(fetchOrders, 5000);
    const sub = supabase
      .channel(`restaurant_orders_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `partner_id=eq.${id}` },
        fetchOrders
      )
      .subscribe();

    return () => {
      window.clearInterval(refreshInterval);
      supabase.removeChannel(sub);
    };
  }, [id]);

  useEffect(() => {
    const closeCalendar = () => setCalendarOpen(false);
    window.addEventListener('click', closeCalendar);
    return () => window.removeEventListener('click', closeCalendar);
  }, []);

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
        throw new Error(
          'Delete blocked by Supabase RLS policy! 0 rows were deleted.'
        );
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
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

      setOrders((prev) =>
        prev.map((o) => (o.id === orderToDelete.id ? { ...o, status: 'cancelled' } : o))
      );
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setDeleteError(err.message || 'Failed to cancel order.');
    } finally {
      setIsDeleting(false);
    }
  };

  const counts = useMemo(() => {
    const periodOrders = dateFilter
      ? orders.filter((o) => orderDateKey(o.created_at) === dateFilter)
      : orders;
    const c = {
      all: periodOrders.length,
      placed: 0,
      preparing: 0,
      prepared: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0,
    };
    periodOrders.forEach((o) => {
      if (c[o.status] !== undefined) c[o.status]++;
    });
    c.active = ACTIVE_ORDER_STATUSES.reduce((total, status) => total + c[status], 0);
    return c;
  }, [orders, dateFilter]);

  const firstOrderCount = useMemo(() => {
    return orders.filter((o) => o.is_first_order).length;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchTab =
        activeTab === 'all' ||
        o.status === activeTab ||
        (activeTab === 'active' && ACTIVE_ORDER_STATUSES.includes(o.status));

      if (firstOrderOnly && !o.is_first_order) return false;

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.delivery_name?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q);

      let matchDate = true;
      if (dateFilter) {
        matchDate = orderDateKey(o.created_at) === dateFilter;
      }

      return matchTab && matchSearch && matchDate;
    });
  }, [orders, activeTab, firstOrderOnly, search, dateFilter]);

  return (
    <div className="space-y-6 font-outfit">
      {/* ── KPI Row ── */}
      <section aria-label="Order totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ORDER_KPIS.map(({ status, icon: Icon, accent }) => {
          const selected = activeTab === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter('status', status === 'all' ? '' : status)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                selected ? 'border-orange-400 ring-1 ring-orange-400' : 'border-slate-200'
              }`}
            >
              <span className={`inline-flex rounded-lg p-2 ${accent}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="mt-2 block text-2xl font-black text-slate-900">
                {loading ? '—' : counts[status]}
              </span>
              <span className="block text-sm font-semibold text-slate-600">
                {STATUS_CONFIG[status].label}
              </span>
            </button>
          );
        })}
      </section>

      {/* ── Filters Row ── */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 basis-[180px]">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Order ID, customer, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-[14px] border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Date Filter */}
          <div className="relative h-11 w-28 shrink-0 sm:w-32">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setCalendarOpen((open) => !open);
              }}
              className="absolute inset-0 flex items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-slate-200 bg-white px-3 text-slate-700 transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <CalendarDays size={16} className="text-slate-500" />
              <span className="whitespace-nowrap text-sm font-bold">
                {!dateFilter
                  ? 'Date'
                  : dateFilter === todayKey
                  ? 'Today'
                  : new Date(`${dateFilter}T00:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
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
                    onClick={() =>
                      setCalendarMonth(
                        (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <p className="text-sm font-black text-slate-800">
                    {calendarMonth.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    aria-label="Next month"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <span key={`${day}-${index}`} className="py-1 text-[10px] font-bold text-slate-400">
                      {day}
                    </span>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (!day) return <span key={`empty-${index}`} />;
                    const key = dateKey(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                    const selected = dateFilter === key;
                    const today = todayKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setFilter('date', key);
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
                      setFilter('date', '');
                      setCalendarOpen(false);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    All dates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('date', todayKey);
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

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchOrders();
            }}
            className="flex h-11 shrink-0 items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
            title="Orders refresh automatically every 5 seconds"
            aria-label="Refresh orders"
          >
            <RefreshCw size={15} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Auto (5s)</span>
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex shrink-0 items-center gap-2">
            {ACTIVE_ORDER_STATUSES.map((key) => {
              const cfg = STATUS_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => setFilter('status', key === 'all' ? '' : key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                    activeTab === key
                      ? `${cfg.bg} ${cfg.color} border-current`
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                  <span className="text-xs opacity-70">{counts[key]}</span>
                </button>
              );
            })}
          </div>

          {/* First Order Toggle */}
          <button
            onClick={() => setFirstOrderOnly((current) => !current)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all ${
              firstOrderOnly
                ? 'border-emerald-600 bg-emerald-100 text-emerald-700'
                : 'border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50'
            }`}
            title="Filter only customers placing their first order"
          >
            <Sparkles size={16} />
            <span>1st Order</span>
            {firstOrderCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-extrabold ${
                  firstOrderOnly ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {firstOrderCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24">
          <Package size={40} className="mb-3 text-slate-300" />
          <p className="font-bold text-slate-600">No orders found</p>
          <p className="mt-1 text-sm text-slate-400">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Order
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Items
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Total
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Time
                  </th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
                  const orderType = ORDER_TYPE_CONFIG[getOrderType(order)] || ORDER_TYPE_CONFIG.delivery;
                  const parts = String(order.id).split('-');
                  const displayId = parts[parts.length - 1].toUpperCase();

                  let items = [];
                  if (order.bill?.items && Array.isArray(order.bill.items)) {
                    items = order.bill.items.map((i) => ({
                      dishName: i.name || i.dishName,
                      quantity: i.qty || i.quantity || 1,
                      price: i.price || 0,
                    }));
                  } else if (Array.isArray(order.items)) {
                    items = order.items.map((i) => ({
                      dishName: i.dishName || i.name,
                      quantity: i.quantity || i.qty || 1,
                      price: i.price || 0,
                    }));
                  }

                  const preview = items.slice(0, 2).map((i) => i.dishName).join(', ');
                  const extra = items.length > 2 ? ` +${items.length - 2}` : '';
                  const totalPrice =
                    order.bill?.customer_total ?? order.bill?.total ?? 0;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/adminfuudr/orders/${order.id}`)}
                      className={`cursor-pointer transition-colors ${orderType.row}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-500">
                            #{displayId}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${orderType.badge}`}>
                            {orderType.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">
                            {order.delivery_name || 'N/A'}
                          </span>
                          {order.is_first_order && (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                              1st Order
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                          {order.delivery_address || '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[200px] truncate text-sm text-slate-600">
                          {preview}
                          {extra ? <span className="text-slate-400">{extra} more</span> : ''}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-black text-slate-900">₹{totalPrice}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setOrderToDelete(order);
                            }}
                            className="group inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 shadow-sm transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                            title="Delete Order"
                          >
                            <Trash2 size={14} className="transition-transform group-hover:scale-110" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
            <span className="text-xs font-semibold text-slate-400">
              Showing {filtered.length} of {orders.length} orders
            </span>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <button
              onClick={() => {
                if (!isDeleting) {
                  setOrderToDelete(null);
                  setDeleteError(null);
                }
              }}
              disabled={isDeleting}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
            >
              <X size={14} />
            </button>

            <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Trash2 size={22} />
            </div>

            <h3 className="mb-1.5 text-base font-bold text-slate-900">
              Delete Order #{String(orderToDelete.id).split('-').pop().toUpperCase()}?
            </h3>

            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              Are you sure you want to permanently delete this order for{' '}
              <strong className="text-slate-700">{orderToDelete.delivery_name || 'Customer'}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <p>{deleteError}</p>
                <button
                  type="button"
                  onClick={handleCancelOrderFallback}
                  disabled={isDeleting}
                  className="w-full rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
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
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
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
