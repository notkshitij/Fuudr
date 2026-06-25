import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, CheckCircle, Clock, Bike, Package, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',   color: 'text-slate-700',   bg: 'bg-slate-100',   dot: 'bg-slate-500',   icon: Package },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-500',   icon: Clock },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',     dot: 'bg-blue-500',    icon: Bike },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500', icon: CheckCircle },
};

export default function AdminFuudr() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, confirmed: 0, preparing: 0, on_the_way: 0, delivered: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_price, delivery_name, created_at, restaurant_name')
      .order('created_at', { ascending: false });

    if (data) {
      const s = { total: data.length, confirmed: 0, preparing: 0, on_the_way: 0, delivered: 0, revenue: 0 };
      data.forEach(o => {
        if (s[o.status] !== undefined) s[o.status]++;
        s.revenue += Number(o.total_price) || 0;
      });
      setStats(s);
      setRecentOrders(data.slice(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    const sub = supabase
      .channel('admin_dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const activeCount = stats.confirmed + stats.preparing + stats.on_the_way;

  const statCards = [
    { label: 'Total Orders',   value: stats.total,          icon: ShoppingBag,  accent: 'orange' },
    { label: 'Active Now',     value: activeCount,          icon: Zap,          accent: 'blue',   pulse: activeCount > 0 },
    { label: 'Delivered',      value: stats.delivered,      icon: CheckCircle,  accent: 'emerald' },
    { label: 'Total Revenue',  value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, accent: 'violet' },
  ];

  const accentMap = {
    orange:  { card: 'border-orange-100',  icon: 'bg-orange-50 text-orange-600',  val: 'text-orange-600' },
    blue:    { card: 'border-blue-100',    icon: 'bg-blue-50 text-blue-600',      val: 'text-blue-600' },
    emerald: { card: 'border-emerald-100', icon: 'bg-emerald-50 text-emerald-600',val: 'text-emerald-600' },
    violet:  { card: 'border-violet-100',  icon: 'bg-violet-50 text-violet-600',  val: 'text-violet-600' },
  };

  return (
    <div className="font-outfit space-y-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time overview of all Fuudr orders & deliveries.</p>
        </div>
        <button
          onClick={() => navigate('/adminfuudr/orders')}
          className="group self-start md:self-auto flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-md shadow-orange-500/25 hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          View Live Orders
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent, pulse }) => {
          const a = accentMap[accent];
          return (
            <div key={label} className={`bg-white rounded-2xl border ${a.card} p-5 flex flex-col gap-4`}>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.icon}`}>
                  <Icon size={20} />
                </div>
                {pulse && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    Live
                  </span>
                )}
              </div>
              <div>
                <p className={`text-2xl font-black ${a.val}`}>{loading ? '—' : value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Status Breakdown + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5 text-base">Order Status Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = stats[key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const Icon = cfg.icon;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                        <Icon size={13} className={cfg.color} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{loading ? '—' : count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.dot} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-base">Recent Orders</h2>
            <button
              onClick={() => navigate('/adminfuudr/orders')}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag size={36} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No orders yet</p>
              <p className="text-sm text-slate-400 mt-1">Orders will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
                const Icon = cfg.icon;
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/adminfuudr/orders/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{order.delivery_name || 'Unknown'}</p>
                      {order.restaurant_name && (
                        <p className="text-xs text-slate-400 truncate">{order.restaurant_name}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">#{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
