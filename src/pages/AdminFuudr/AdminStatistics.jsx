import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FinancialKpis } from './components/FinancialKpis';
import { OrdersAnalyticsChart } from './components/OrdersAnalyticsChart';

async function fetchStatisticsOrders(signal) {
  const orders = [];
  let lastId;

  while (true) {
    let query = supabase
      .from('orders')
      .select('id, status, bill, created_at')
      .order('id')
      .limit(500)
      .abortSignal(signal);

    if (lastId !== undefined) query = query.gt('id', lastId);

    const { data, error } = await query;
    if (error) throw error;
    if (data.length === 0) return orders;

    orders.push(...data);
    lastId = data.at(-1).id;
  }
}

export default function AdminStatistics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let request;

    const refresh = async () => {
      request?.abort();
      request = new AbortController();
      const { signal } = request;

      try {
        const data = await fetchStatisticsOrders(signal);
        if (signal.aborted) return;
        setOrders(data);
        setError(false);
      } catch (err) {
        if (signal.aborted) return;
        console.error('Error loading admin statistics:', err);
        setError(true);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    refresh();
    const subscription = supabase
      .channel('admin_statistics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refresh)
      .subscribe();

    return () => {
      request?.abort();
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="font-outfit space-y-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Statistics</h1>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Statistics could not be loaded. Reload the page to try again.
        </p>
      ) : (
        <>
          <FinancialKpis orders={orders} loading={loading} />
          <OrdersAnalyticsChart orders={orders} loading={loading} />
        </>
      )}
    </div>
  );
}
