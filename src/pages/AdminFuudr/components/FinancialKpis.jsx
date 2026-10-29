import { calculateFinancialKpis } from '../utils/financialKpis';

const currency = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export function FinancialKpis({ orders, loading }) {
  const kpis = calculateFinancialKpis(orders);
  const cards = [
    { label: 'Gross sales', value: kpis.grossSales, formula: 'Food cost + delivery charges', colors: 'border-blue-200 bg-blue-50/70 text-blue-700' },
    { label: 'Sales', value: kpis.sales, formula: 'Food cost, including add-ons', colors: 'border-orange-200 bg-orange-50/70 text-orange-700' },
    { label: 'Revenue', value: kpis.revenue, formula: 'Delivery charges only', colors: 'border-emerald-200 bg-emerald-50/70 text-emerald-700' },
    { label: 'Total discount', value: kpis.discount, formula: 'Discounts on included orders', colors: 'border-rose-200 bg-rose-50/70 text-rose-700' },
    { label: 'Profit', value: kpis.profit, formula: 'Revenue − discount', colors: 'border-violet-200 bg-violet-50/70 text-violet-700' },
  ];

  return (
    <section className="space-y-4" aria-label="Financial KPIs">
      <div>
        <h2 className="text-base font-bold text-slate-900">Financial KPIs</h2>
        <p className="text-xs text-slate-500 mt-1">All time · Non-cancelled orders · Before taxes</p>
      </div>
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map(({ label, value, formula, colors }) => (
          <div key={label} className={`min-w-0 rounded-2xl border p-4 shadow-sm ${colors}`}>
            <p className="text-xs font-semibold opacity-80">{label}</p>
            <p className={`mt-2 break-words text-xl font-black ${value < 0 ? 'text-rose-600' : ''}`}>{loading ? '—' : currency(value)}</p>
            <p className="mt-2 text-xs opacity-70">{formula}</p>
          </div>
        ))}
      </div>
      {kpis.missingBills > 0 && <p role="status" className="text-xs text-amber-700">{kpis.missingBills} orders lack food or delivery amounts and are excluded from these financial totals.</p>}
    </section>
  );
}
