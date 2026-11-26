import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShoppingBag, XCircle, Zap } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ACTIVE_ORDER_STATUSES, getOrderType, orderDateKey } from './utils/orderOverview';

const CLOSED_STATUSES = ['delivered', 'cancelled'];
const ORDER_PATH = '/adminfuudr/orders';
const ORDER_FIELDS = 'id, status, created_at, delivery_name, order_type, bill, assigned_rider_id, rider_response, delivery_assignees';
const ORDER_FIELDS_WITH_PARTNER = `${ORDER_FIELDS}, partners!orders_partner_id_fkey(restaurant_name)`;

const orderTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
});

const statusStyles = {
  placed: ['Placed', 'bg-slate-100 text-slate-700'],
  preparing: ['Preparing', 'bg-amber-50 text-amber-700'],
  prepared: ['Prepared', 'bg-violet-50 text-violet-700'],
  on_the_way: ['On the Way', 'bg-blue-50 text-blue-700'],
  delivered: ['Delivered', 'bg-emerald-50 text-emerald-700'],
  cancelled: ['Cancelled', 'bg-rose-50 text-rose-700'],
};

async function fetchDashboardOrders(today, signal, fields = ORDER_FIELDS_WITH_PARTNER) {
  const start = new Date(`${today}T00:00:00+05:30`).toISOString();
  const orders = [];
  const recentFields = fields === ORDER_FIELDS_WITH_PARTNER
    ? 'id, status, created_at, delivery_name, partners!orders_partner_id_fkey(restaurant_name)'
    : 'id, status, created_at, delivery_name';
  const recentQuery = supabase.from('orders').select(recentFields)
    .in('status', CLOSED_STATUSES)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .limit(5).abortSignal(signal);

  const fetchQueue = async () => {
    let lastId;
    while (!signal.aborted) {
      let query = supabase.from('orders').select(fields)
        .or(`created_at.gte.${start},status.in.(${ACTIVE_ORDER_STATUSES.join(',')})`)
        .order('id').limit(500).abortSignal(signal);
      if (lastId !== undefined) query = query.gt('id', lastId);
      const { data, error } = await query;
      if (error) return error;
      if (data.length === 0) break;
      orders.push(...data);
      lastId = data.at(-1).id;
    }
  };

  const [queueError, recent] = await Promise.all([fetchQueue(), recentQuery]);
  const error = queueError || recent.error;
  if (error) {
    if (!signal.aborted && fields !== ORDER_FIELDS) return fetchDashboardOrders(today, signal, ORDER_FIELDS);
    throw error;
  }
  return { orders, recent: recent.data };
}

function assignedRider(order, riderNames) {
  if (order.rider_response === 'rejected') return '';
  if (order.assigned_rider_id) {
    return riderNames[order.assigned_rider_id] || order.delivery_assignees?.join(', ') || 'Rider assigned';
  }
  return order.delivery_assignees?.join(', ') || '';
}

function OrderSection({ title, empty, loading, rows, link, linkText }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold">{title}</h2>
        {link && <Link to={link} className="text-sm font-bold text-orange-700 hover:underline">{linkText}</Link>}
      </div>
      {loading ? (
        <p role="status" className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500 sm:px-6">Loading orders…</p>
      ) : rows.length ? (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">{rows}</ul>
      ) : (
        <p className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500 sm:px-6">{empty}</p>
      )}
    </section>
  );
}

function OrderRow({ order, detail, showCustomer = false }) {
  const [status, style] = statusStyles[order.status];
  const restaurant = order.partners?.restaurant_name || order.restaurant_name || 'Restaurant unavailable';
  return (
    <li>
      <Link to={`${ORDER_PATH}/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-slate-50 sm:px-6">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-bold text-slate-900">{restaurant}</p>
          <p className="break-all text-xs text-slate-500">Order #{order.id}</p>
          {showCustomer && order.delivery_name && <p className="mt-1 text-sm text-slate-600">{order.delivery_name}</p>}
          <p className="mt-1 text-sm text-slate-600">{detail}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{status}</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-orange-700">
          Open order <ArrowRight size={14} aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

export default function AdminFuudr() {
  const [now, setNow] = useState(Date.now);
  const today = orderDateKey(now);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(false);
  const [riderNames, setRiderNames] = useState({});

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const request = new AbortController();
    supabase.rpc('admin_assignable_riders').abortSignal(request.signal).then(({ data }) => {
      if (data && !request.signal.aborted) {
        setRiderNames(Object.fromEntries(data.map(rider => [rider.id, rider.full_name])));
      }
    });
    return () => request.abort();
  }, []);

  useEffect(() => {
    let request;
    let stopped = false;
    const refresh = async () => {
      if (stopped) return;
      request?.abort();
      request = new AbortController();
      const { signal } = request;
      try {
        const data = await fetchDashboardOrders(today, signal);
        if (signal.aborted) return;
        setSnapshot({ ...data, today });
        setError(false);
      } catch (err) {
        if (signal.aborted) return;
        console.error('Error loading dashboard orders:', err);
        setError(true);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 30_000);
    const subscription = supabase.channel('admin_dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, refresh)
      .subscribe();
    return () => {
      stopped = true;
      window.clearInterval(interval);
      request?.abort();
      supabase.removeChannel(subscription);
    };
  }, [today]);

  const loading = snapshot?.today !== today && !error;
  const orders = snapshot?.orders ?? [];
  const todaysOrders = orders.filter(order => orderDateKey(order.created_at) === today);
  const counts = { delivered: 0, cancelled: 0 };
  for (const order of todaysOrders) {
    if (Object.hasOwn(counts, order.status)) counts[order.status]++;
  }

  const active = orders.filter(order => ACTIVE_ORDER_STATUSES.includes(order.status))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map(order => {
      const minutes = Math.max(0, Math.floor((now - Date.parse(order.created_at)) / 60_000));
      const age = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
      const rider = assignedRider(order, riderNames);
      const fulfillment = getOrderType(order) === 'pickup' ? 'Customer pickup' : rider || 'Rider unassigned';
      const elapsed = Number.isFinite(minutes) ? `${age} since placed` : '';
      return { order, detail: [elapsed, fulfillment].filter(Boolean).join(' · ') };
    });

  const dateQuery = `date=${today}`;
  const cards = [
    ['Orders Today', todaysOrders.length, ShoppingBag, dateQuery, 'border-orange-100 text-orange-700'],
    ['Active Now', active.length, Zap, 'status=active', 'border-blue-100 text-blue-700'],
    ['Delivered Today', counts.delivered, CheckCircle, `status=delivered&${dateQuery}`, 'border-emerald-100 text-emerald-700'],
    ['Cancelled Today', counts.cancelled, XCircle, `status=cancelled&${dateQuery}`, 'border-rose-100 text-rose-700'],
  ];

  return (
    <div className="space-y-6 font-outfit">
      <section aria-label="Order summary">
        <div className="mb-3">
          <h1 className="text-xl font-black text-slate-900">Order overview</h1>
          <p className="text-sm text-slate-500">Today’s counts are based on when orders were placed (India time).</p>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map(([label, count, Icon, query, style]) => (
            <Link key={label} to={`${ORDER_PATH}?${query}`} className={`rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md ${style}`}>
              <Icon size={20} aria-hidden="true" />
              <p className="mt-2 text-2xl font-black">{loading || error ? '—' : count}</p>
              <p className="text-sm font-semibold text-slate-700">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Dashboard orders could not be loaded. Reload the page to try again.
        </p>
      ) : (
        <>
          <OrderSection
            title="Active Orders" empty="No active orders." loading={loading}
            link={`${ORDER_PATH}?status=active`} linkText="View active orders"
            rows={active.map(({ order, detail }) => <OrderRow key={order.id} order={order} detail={detail} />)}
          />
          <OrderSection
            title="Recent Orders" empty="No delivered or cancelled orders yet." loading={loading}
            link={ORDER_PATH} linkText="View all orders"
            rows={(snapshot?.recent ?? []).map(order => (
              <OrderRow key={order.id} order={order} showCustomer detail={orderDateKey(order.created_at)
                ? `Placed ${orderTime.format(new Date(order.created_at))}` : ''} />
            ))}
          />
        </>
      )}
    </div>
  );
}
