import React, { useState, useMemo } from 'react';
import { TrendingUp, ShoppingBag, Calendar, ArrowUpRight, BarChart3 } from 'lucide-react';

export function OrdersAnalyticsChart({ orders = [], loading = false }) {
  const [timeRange, setTimeRange] = useState('7d'); // '7d' | '14d' | '30d'
  const [metric, setMetric] = useState('orders'); // 'orders' | 'revenue'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process order data into time buckets
  const chartData = useMemo(() => {
    const daysCount = timeRange === '30d' ? 30 : timeRange === '14d' ? 14 : 7;
    const now = new Date();
    const result = [];

    // Create daily map
    const dayMap = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString('en-US', {
        weekday: daysCount <= 7 ? 'short' : undefined,
        month: 'short',
        day: 'numeric',
      });
      dayMap[key] = { key, label, date: d, count: 0, revenue: 0 };
    }

    // Populate with real orders
    orders.forEach(order => {
      if (!order.created_at) return;
      const orderKey = new Date(order.created_at).toISOString().split('T')[0];
      if (dayMap[orderKey]) {
        dayMap[orderKey].count += 1;
        if (order.status !== 'cancelled') {
          const rev = Number(order.bill?.total ?? order.total_price ?? 0);
          dayMap[orderKey].revenue += isNaN(rev) ? 0 : rev;
        }
      }
    });

    return Object.values(dayMap);
  }, [orders, timeRange]);

  // Aggregate stats
  const totals = useMemo(() => {
    let totalOrders = 0;
    let totalRevenue = 0;
    let peakDay = { label: '—', val: 0 };

    chartData.forEach(d => {
      totalOrders += d.count;
      totalRevenue += d.revenue;
      const curVal = metric === 'orders' ? d.count : d.revenue;
      if (curVal > peakDay.val) {
        peakDay = { label: d.label, val: curVal };
      }
    });

    const avgOrders = (totalOrders / (chartData.length || 1)).toFixed(1);
    return { totalOrders, totalRevenue, peakDay, avgOrders };
  }, [chartData, metric]);

  // Chart dimensions & SVG path calculations
  const { pathD, areaD, points, maxY } = useMemo(() => {
    const width = 800;
    const height = 230;
    const paddingX = 45;
    const paddingY = 40;

    const values = chartData.map(d => metric === 'orders' ? d.count : d.revenue);
    const maxVal = Math.max(...values, metric === 'orders' ? 5 : 100);
    const niceMax = Math.ceil(maxVal * 1.25);

    const stepX = (width - paddingX * 2) / (chartData.length - 1 || 1);

    const pts = chartData.map((d, i) => {
      const val = metric === 'orders' ? d.count : d.revenue;
      const x = paddingX + i * stepX;
      const y = height - paddingY - (val / niceMax) * (height - paddingY * 2);
      return { x, y, val, label: d.label, raw: d };
    });

    if (pts.length === 0) return { pathD: '', areaD: '', points: [], maxY: niceMax };

    // Generate smooth bezier curve path
    let pD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      pD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const aD = `${pD} L ${pts[pts.length - 1].x} ${height - paddingY} L ${pts[0].x} ${height - paddingY} Z`;

    return { pathD: pD, areaD: aD, points: pts, maxY: niceMax };
  }, [chartData, metric]);

  const activeColor = metric === 'orders' ? '#f97316' : '#8b5cf6'; // Orange for orders, Purple for revenue

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm overflow-visible">
      {/* Header with Title, Filter & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Orders & Sales Analytics</h2>
            <p className="text-xs text-slate-500 font-medium">Daily transaction volume and revenue trends</p>
          </div>
        </div>

        {/* Controls: Metric Toggle + Time Range */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMetric('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                metric === 'orders'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orders Count
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                metric === 'revenue'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue (₹)
            </button>
          </div>

          {/* Time Range Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['7d', '14d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Stat Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Period Total</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block">
            {metric === 'orders' ? `${totals.totalOrders} Orders` : `₹${totals.totalRevenue.toLocaleString()}`}
          </span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Daily Average</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block">
            {metric === 'orders' 
              ? `${totals.avgOrders} / day` 
              : `₹${Math.round(totals.totalRevenue / chartData.length).toLocaleString()} / day`
            }
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Peak Day</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block truncate">
            {totals.peakDay.val > 0 
              ? `${totals.peakDay.label} (${metric === 'orders' ? `${totals.peakDay.val} orders` : `₹${totals.peakDay.val}`})` 
              : 'None'
            }
          </span>
        </div>
      </div>

      {/* SVG Interactive Graph */}
      <div className="relative w-full pt-4 pb-2 overflow-visible">
        <svg
          viewBox="0 0 800 230"
          className="w-full h-48 sm:h-64 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="orderAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.25" />
              <stop offset="90%" stopColor={activeColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor={activeColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = 35 + ratio * 150;
            const valLabel = Math.round(maxY * (1 - ratio));
            return (
              <g key={ratio}>
                <line
                  x1="35"
                  y1={y}
                  x2="765"
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x="28"
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-300 font-semibold"
                >
                  {metric === 'revenue' ? `₹${valLabel}` : valLabel}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#orderAreaGradient)"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Smooth Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="transition-all duration-500 ease-out"
            />
          )}

          {/* Interactive Data Points & Hover/Click Targets */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.raw?.key === pt.raw.key;
            return (
              <g key={pt.raw.key} className="cursor-pointer" onClick={() => setHoveredPoint(isHovered ? null : pt)}>
                {/* Invisible large hit area for easy tapping & clicking */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="20"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
                {/* Outer Ring on Hover / Selection */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={activeColor}
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}
                {/* Main point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : pt.val > 0 ? 4 : 2.5}
                  fill="#ffffff"
                  stroke={activeColor}
                  strokeWidth={isHovered ? 3.5 : 2}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
                {/* X Axis Labels */}
                {(chartData.length <= 14 || i % 2 === 0 || i === chartData.length - 1) && (
                  <text
                    x={pt.x}
                    y="220"
                    textAnchor="middle"
                    className={`text-[10px] font-semibold transition-colors ${
                      isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                    }`}
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Small Compact Tooltip Floating Directly on Top of Point */}
        {hoveredPoint && (() => {
          const ratioX = hoveredPoint.x / 800;
          const translateX = ratioX < 0.15 ? '-15%' : ratioX > 0.85 ? '-85%' : '-50%';
          const arrowLeft = ratioX < 0.15 ? '20%' : ratioX > 0.85 ? '80%' : '50%';

          return (
            <div
              className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 text-xs transition-all duration-150 whitespace-nowrap"
              style={{
                left: `${(hoveredPoint.x / 800) * 100}%`,
                top: `${(hoveredPoint.y / 230) * 100}%`,
                transform: `translate(${translateX}, -100%)`,
                marginTop: '-8px',
              }}
            >
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] text-slate-300 font-bold uppercase">{hoveredPoint.label}</span>
                <span className="text-slate-600 font-bold">·</span>
                <span className="text-orange-400 font-black text-[11px]">{hoveredPoint.raw.count} orders</span>
                <span className="text-slate-600 font-bold">·</span>
                <span className="text-purple-400 font-black text-[11px]">₹{hoveredPoint.raw.revenue.toLocaleString('en-IN')}</span>
              </div>
              {/* Downward pointing caret */}
              <div
                className="absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95 -translate-x-1/2"
                style={{ left: arrowLeft }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
