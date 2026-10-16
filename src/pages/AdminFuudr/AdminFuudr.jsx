import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, ShoppingBag, CheckCircle, Clock, Bike, Package, TrendingUp, Zap, Store, GraduationCap } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PlatformStatusToggle } from './components/PlatformStatusToggle';
import { OrdersAnalyticsChart } from './components/OrdersAnalyticsChart';

const STATUS_CONFIG = {
  placed:     { label: 'Placed',      color: 'text-slate-700',   bg: 'bg-slate-100',   dot: 'bg-slate-500',   icon: Package },
  preparing:  { label: 'Preparing',   color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-500',   icon: Clock },
  on_the_way: { label: 'On the Way',  color: 'text-blue-700',    bg: 'bg-blue-50',     dot: 'bg-blue-500',    icon: Bike },
  delivered:  { label: 'Delivered',   color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',   color: 'text-rose-700',    bg: 'bg-rose-50',     dot: 'bg-rose-500',    icon: CheckCircle },
};

export default function AdminFuudr() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, placed: 0, preparing: 0, on_the_way: 0, delivered: 0, cancelled: 0, revenue: 0 });
  const [partnerStats, setPartnerStats] = useState({ total: 0, poornima: 0 });
  const [allOrders, setAllOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, partnersRes] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id,
            status,
            bill,
            delivery_name,
            created_at,
            partners!orders_partner_id_fkey (
              restaurant_name,
              is_poornima
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('partners')
          .select('id, is_poornima')
      ]);

      let ordersData = ordersRes.data;
      if (ordersRes.error) {
        console.warn('Orders joined query failed:', ordersRes.error.message, 'Trying plain select...');
        const plainOrders = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (plainOrders.error) {
          console.error('Plain orders query also failed:', plainOrders.error.message);
        } else {
          ordersData = plainOrders.data;
        }
      }

      if (partnersRes.data) {
        const totalP = partnersRes.data.length;
        const poornimaP = partnersRes.data.filter(p => p.is_poornima).length;
        setPartnerStats({ total: totalP, poornima: poornimaP });
      } else if (partnersRes.error) {
        console.error('Partners query failed:', partnersRes.error.message);
      }

      if (ordersData) {
        const data = ordersData;
        setAllOrders(data);
        const s = { total: data.length, placed: 0, preparing: 0, on_the_way: 0, delivered: 0, cancelled: 0, revenue: 0 };
        data.forEach(o => {
          if (s[o.status] !== undefined) s[o.status]++;
          if (o.status !== 'cancelled') {
            const totalPrice = o.bill?.customer_total ?? o.bill?.total ?? o.total_price ?? 0;
            s.revenue += Number(totalPrice) || 0;
          }
        });
        setStats(s);
        setRecentOrders(data.slice(0, 5).map(o => ({
          ...o,
          restaurant_name: o.partners?.restaurant_name ?? o.restaurant_name,
          is_poornima: o.partners?.is_poornima ?? o.is_poornima ?? false
        })));
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const sub = supabase
      .channel('admin_dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchDashboardData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  useEffect(() => {
    const closeStatusDropdown = () => setOpenStatusDropdownId(null);
    window.addEventListener('click', closeStatusDropdown);
    return () => window.removeEventListener('click', closeStatusDropdown);
  }, []);

  const handleRecentOrderStatusChange = async (event, order, newStatus) => {
    event.stopPropagation();
    setOpenStatusDropdownId(null);
    if (newStatus === order.status) return;

    setUpdatingOrderId(order.id);
    setRecentOrders(current => current.map(item =>
      item.id === order.id ? { ...item, status: newStatus } : item
    ));

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      setRecentOrders(current => current.map(item =>
        item.id === order.id ? { ...item, status: order.status } : item
      ));
      console.error('Error updating order status:', error);
      alert(`Could not update order status: ${error.message}`);
    } else {
      await fetchDashboardData();
    }
    setUpdatingOrderId(null);
  };

  const activeCount = stats.placed + stats.preparing + stats.on_the_way;

  const statCards = [
    { label: 'Total Orders',   value: stats.total,          icon: ShoppingBag,  accent: 'orange' },
    { label: 'Active Now',     value: activeCount,          icon: Zap,          accent: 'blue',   pulse: activeCount > 0 },
    { label: 'Delivered',      value: stats.delivered,      icon: CheckCircle,  accent: 'emerald' },
    { label: 'Total Sales',    value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: TrendingUp, accent: 'violet' },
  ];

  const accentMap = {
    orange:  { card: 'border-orange-100',  icon: 'bg-orange-50 text-orange-600',  val: 'text-orange-600' },
    blue:    { card: 'border-blue-100',    icon: 'bg-blue-50 text-blue-600',      val: 'text-blue-600' },
    emerald: { card: 'border-emerald-100', icon: 'bg-emerald-50 text-emerald-600',val: 'text-emerald-600' },
    violet:  { card: 'border-violet-100',  icon: 'bg-violet-50 text-violet-600',  val: 'text-violet-600' },
  };

  return (
    <div className="font-outfit space-y-8">



      {/* ── Master Platform ON/OFF Switch ── */}
      <PlatformStatusToggle />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, accent, pulse }) => {
          const a = accentMap[accent];
          return (
            <div
              key={label}
              className={`min-w-0 bg-white rounded-md sm:rounded-2xl border ${a.card} p-2 sm:p-5 flex flex-col justify-between min-h-[82px] sm:min-h-[130px] shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center ${a.icon}`}>
                  <Icon size={14} className="sm:w-5 sm:h-5" />
                </div>
                {pulse && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    Live
                  </span>
                )}
              </div>
              <div className="mt-1.5 sm:mt-3">
                <p className={`text-[11px] min-[375px]:text-xs sm:text-2xl font-black tracking-tight leading-none whitespace-nowrap ${a.val}`}>
                  {loading ? '—' : value}
                </p>
                <p className="text-[8px] min-[375px]:text-[9px] sm:text-xs font-semibold text-slate-500 mt-1 sm:mt-1.5 leading-tight whitespace-nowrap">
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Orders & Sales Analytics Graph ── */}
      <OrdersAnalyticsChart orders={allOrders} loading={loading} />

      {/* ── Recent Orders ── */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
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
              {recentOrders.map((order, orderIndex) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
                const Icon = cfg.icon;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/adminfuudr/orders/${order.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') navigate(`/adminfuudr/orders/${order.id}`);
                    }}
                    role="link"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{order.delivery_name || 'Unknown'}</p>
                      {order.restaurant_name && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{order.restaurant_name}</p>
                          {order.is_poornima && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <GraduationCap size={9} /> Inside Poornima
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenStatusDropdownId(current => current === order.id ? null : order.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-expanded={openStatusDropdownId === order.id}
                        aria-haspopup="menu"
                        aria-label={`Change status for order ${order.id}`}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md cursor-pointer disabled:cursor-wait disabled:opacity-60 ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                        <ChevronDown size={12} className={`transition-transform ${openStatusDropdownId === order.id ? 'rotate-180' : ''}`} />
                      </button>
                      {openStatusDropdownId === order.id && (
                        <div
                          role="menu"
                          onClick={(event) => event.stopPropagation()}
                          className={`absolute right-5 z-30 w-36 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-xl ${
                            orderIndex >= recentOrders.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'
                          }`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <button
                              key={status}
                              type="button"
                              role="menuitem"
                              onClick={(event) => handleRecentOrderStatusChange(event, order, status)}
                              className={`w-full rounded-sm px-2.5 py-2 text-left text-xs font-bold hover:bg-slate-50 ${status === order.status ? `${config.bg} ${config.color}` : 'text-slate-600'}`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
