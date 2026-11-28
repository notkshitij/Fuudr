import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

const statusStyles = {
  captured: 'bg-emerald-50 text-emerald-800',
  authorized: 'bg-amber-50 text-amber-800',
  failed: 'bg-rose-50 text-rose-800',
  refunded: 'bg-blue-50 text-blue-800',
};

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount / 100);
}

const controlStyle = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40';

export default function RazorpayTransactions() {
  const [query, setQuery] = useState({ page: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPayments() {
      try {
        const { data, error: loadError } = await supabase.functions.invoke('admin-razorpay-transactions', {
          body: query,
          signal: controller.signal,
        });
        if (loadError) {
          const response = await loadError.context?.json?.().catch(() => null);
          throw new Error(response?.error || 'Could not load Razorpay payments. Try again.');
        }
        if (!controller.signal.aborted) setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPayments();
    return () => controller.abort();
  }, [query]);

  function requestPage(page, asOf) {
    setLoading(true);
    setError('');
    setResult(null);
    setQuery({ page, asOf });
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Razorpay Transactions</h1>
          {result?.mode && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
              {result.mode} mode
            </span>
          )}
        </div>
        <button type="button" className={controlStyle} disabled={loading} onClick={() => requestPage(0)}>
          <RefreshCw size={15} aria-hidden="true" /> Refresh
        </button>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
        {loading ? (
          <p role="status" className="p-8 text-center text-sm text-slate-600">Loading payments…</p>
        ) : error ? (
          <div className="space-y-3 p-8 text-center">
            <p role="alert" className="text-sm text-rose-800">{error}</p>
            <button type="button" className={controlStyle} onClick={() => requestPage(query.page, query.asOf)}>Retry</button>
          </div>
        ) : result?.payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  {['Payment ID', 'Razorpay order ID', 'Amount', 'Status', 'Method', 'Refunded', 'Created (IST)'].map(label => (
                    <th key={label} scope="col" className="px-4 py-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {result.payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">{payment.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payment.orderId || '—'}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatAmount(payment.amount, payment.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[payment.status] || 'bg-slate-100 text-slate-700'}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{payment.method?.toUpperCase() || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{payment.refunded ? formatAmount(payment.refunded, payment.currency) : '—'}</td>
                    <td className="px-4 py-3">{dateTime.format(payment.createdAt * 1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-slate-600">No payments found.</p>
        )}

        {(query.page > 0 || result?.hasNext) && (
          <nav aria-label="Payment pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-600">Page {query.page + 1}</span>
            <div className="flex gap-2">
              <button type="button" className={controlStyle} disabled={loading || query.page === 0}
                onClick={() => requestPage(query.page - 1, result?.asOf ?? query.asOf)}>
                <ChevronLeft size={16} aria-hidden="true" /> Previous
              </button>
              <button type="button" className={controlStyle} disabled={loading || !result?.hasNext}
                onClick={() => requestPage(query.page + 1, result.asOf)}>
                Next <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
