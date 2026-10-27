import { calculateFinancialKpis } from '../utils/financialKpis';

const currency = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export function FinancialKpis({ orders, loading }) {
  const kpis = calculateFinancialKpis(orders);
  const cards = [
    ['Gross sales', kpis.grossSales, 'Food cost + delivery charges'],
    ['Sales', kpis.sales, 'Food cost, including add-ons'],
    ['Revenue', kpis.revenue, 'Delivery charges only'],
    ['Total discount', kpis.discount, 'Discounts on included orders'],
    ['Profit', kpis.profit, 'Revenue − discount'],
  ];
  return (
    <section className="space-y-4" aria-label="Financial KPIs">
      <div>
        <h2 className="text-base font-bold text-slate-900">Financial KPIs</h2>
        <p className="text-xs text-slate-500 mt-1">All time · Non-cancelled orders · Before taxes</p>
      </div>
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map(([label, value, formula]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-2 text-xl font-black break-words ${value < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{loading ? '—' : currency(value)}</p>
            <p className="mt-2 text-xs text-slate-400">{formula}</p>
          </div>
        ))}
      </div>
      {kpis.missingBills > 0 && <p role="status" className="text-xs text-amber-700">{kpis.missingBills} orders lack food or delivery amounts and are excluded from these financial totals.</p>}
    </section>
  );
}
