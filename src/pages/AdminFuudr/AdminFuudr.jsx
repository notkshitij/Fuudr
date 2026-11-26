import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShoppingBag, XCircle, Zap } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ACTIVE_ORDER_STATUSES, orderDateKey } from './utils/orderOverview';
import OrdersTableView, { markFirstOrders } from './components/OrdersTableView';

const CLOSED_STATUSES = ['delivered', 'cancelled'];
const ORDER_PATH = '/adminfuudr/orders';
const ORDER_FIELDS_WITH_PARTNER = `
  *,
  partners!orders_partner_id_fkey (
    restaurant_name,
    is_poornima
  )
`;
const ORDER_FIELDS = '*';

async function fetchDashboardOrders(today, signal, fields = ORDER_FIELDS_WITH_PARTNER) {
  const start = new Date(`${today}T00:00:00+05:30`).toISOString();
  const orders = [];
  const recentQuery = supabase
    .from('orders')
    .select(fields)
    .in('status', CLOSED_STATUSES)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(10)
    .abortSignal(signal);

  const fetchQueue = async () => {
    let lastId;
    while (!signal.aborted) {
      let query = supabase
        .from('orders')
        .select(fields)
        .or(`created_at.gte.${start},status.in.(${ACTIVE_ORDER_STATUSES.join(',')})`)
        .order('id')
        .limit(500)
        .abortSignal(signal);
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
  return { orders, recent: recent.data || [] };
}

export default function AdminFuudr() {
  const [now, setNow] = useState(Date.now);
  const today = orderDateKey(now);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
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
    const subscription = supabase
      .channel('admin_dash')
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
  const todaysOrders = orders.filter((order) => orderDateKey(order.created_at) === today);
  const counts = { delivered: 0, cancelled: 0 };
  for (const order of todaysOrders) {
    if (Object.hasOwn(counts, order.status)) counts[order.status]++;
  }

  const activeOrders = useMemo(() => {
    const rawActive = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
    const allForFirstOrders = [...(snapshot?.orders ?? []), ...(snapshot?.recent ?? [])];
    const withFirst = markFirstOrders(allForFirstOrders);
    const firstOrderMap = new Map(withFirst.map((o) => [o.id, o.is_first_order]));

    return rawActive
      .map((o) => ({ ...o, is_first_order: !!firstOrderMap.get(o.id) }))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [orders, snapshot]);

  const recentOrders = useMemo(() => {
    const rawRecent = snapshot?.recent ?? [];
    const allForFirstOrders = [...(snapshot?.orders ?? []), ...(snapshot?.recent ?? [])];
    const withFirst = markFirstOrders(allForFirstOrders);
    const firstOrderMap = new Map(withFirst.map((o) => [o.id, o.is_first_order]));

    return rawRecent.map((o) => ({ ...o, is_first_order: !!firstOrderMap.get(o.id) }));
  }, [snapshot]);

  const dateQuery = `date=${today}`;
  const cards = [
    ['Orders Today', todaysOrders.length, ShoppingBag, dateQuery, 'border-orange-100 text-orange-700'],
    ['Active Now', activeOrders.length, Zap, 'status=active', 'border-blue-100 text-blue-700'],
    ['Delivered Today', counts.delivered, CheckCircle, `status=delivered&${dateQuery}`, 'border-emerald-100 text-emerald-700'],
    ['Cancelled Today', counts.cancelled, XCircle, `status=cancelled&${dateQuery}`, 'border-rose-100 text-rose-700'],
  ];

  return (
    <div className="space-y-6 font-outfit">
      {/* ── Order Overview KPIs ── */}
      <section aria-label="Order summary">
        <div className="mb-3">
          <h1 className="text-xl font-black text-slate-900">Order overview</h1>
          <p className="text-sm text-slate-500">Today’s counts are based on when orders were placed (India time).</p>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map(([label, count, Icon, query, style]) => (
            <Link
              key={label}
              to={`${ORDER_PATH}?${query}`}
              className={`rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${style}`}
            >
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
        <div className="space-y-6">
          {/* ── Active Orders ── */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Active Orders</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {loading ? '…' : activeOrders.length}
                </span>
              </div>
              <Link
                to={`${ORDER_PATH}?status=active`}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
              >
                <span>View active orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <OrdersTableView
              orders={activeOrders}
              loading={loading}
              emptyMessage="No active orders right now."
              showRestaurant={true}
              basePath={ORDER_PATH}
            />
          </section>

          {/* ── Recent Orders ── */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Recent Orders</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {loading ? '…' : recentOrders.length}
                </span>
              </div>
              <Link
                to={ORDER_PATH}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
              >
                <span>View all orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <OrdersTableView
              orders={recentOrders}
              loading={loading}
              emptyMessage="No delivered or cancelled orders yet."
              showRestaurant={true}
              basePath={ORDER_PATH}
            />
          </section>
        </div>
      )}
    </div>
  );
}
