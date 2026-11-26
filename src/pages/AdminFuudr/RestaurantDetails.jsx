import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  IndianRupee,
  Layers,
  Loader2,
  ShoppingBag,
  Star,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ACTIVE_ORDER_STATUSES, getOrderType, orderDateKey } from './utils/orderOverview';
import { calculateFinancialKpis } from './utils/financialKpis';
import OrdersTableView, { markFirstOrders } from './components/OrdersTableView';

const formatCurrency = (amount) =>
  `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [addonCount, setAddonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [
          { data: partnerData, error: partnerError },
          { data: ordersData, error: ordersError },
          { data: menuData, error: menuError },
          addonsRes,
        ] = await Promise.all([
          supabase.rpc('admin_list_partners').eq('id', id).maybeSingle(),
          supabase
            .from('orders')
            .select('*')
            .eq('partner_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('menu_items')
            .select('id, name, price, is_in_stock, category_name, image_url')
            .eq('partner_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('dish_addons')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', id),
        ]);

        if (partnerError) throw partnerError;
        if (ordersError) throw ordersError;
        if (menuError) throw menuError;

        if (!active) return;
        setRestaurant(partnerData || null);
        setOrders(markFirstOrders(ordersData || []));
        setMenuItems(menuData || []);
        setAddonCount(addonsRes?.count || 0);
      } catch (fetchError) {
        if (active) setError(fetchError.message || 'Unable to load this restaurant.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [id]);

  const kpis = useMemo(() => {
    const todayKey = orderDateKey(Date.now());
    const todayOrders = orders.filter((o) => orderDateKey(o.created_at) === todayKey).length;
    const activeOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

    const financial = calculateFinancialKpis(orders);
    const totalSalesFallback = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.bill?.customer_total ?? o.bill?.total ?? 0) || 0), 0);

    const inStock = menuItems.filter((item) => item.is_in_stock !== false).length;
    const outOfStock = menuItems.length - inStock;

    return {
      totalOrders: orders.length,
      todayOrders,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
      sales: financial.sales > 0 ? financial.sales : totalSalesFallback,
      totalItems: menuItems.length,
      inStock,
      outOfStock,
    };
  }, [orders, menuItems]);

  const handleToggleOpen = async () => {
    if (!restaurant || togglingOpen) return;
    const newValue = restaurant.is_open === false;
    setTogglingOpen(true);
    try {
      const { error: updateError } = await supabase
        .from('partners')
        .update({ is_open: newValue })
        .eq('id', id);
      if (updateError) throw updateError;
      setRestaurant((prev) => (prev ? { ...prev, is_open: newValue } : prev));
    } catch (err) {
      console.error('Failed to toggle open status:', err);
      alert(err.message || 'Failed to update open status');
    } finally {
      setTogglingOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" aria-label="Loading" />
      </div>
    );
  }
  if (error || !restaurant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="font-bold text-slate-800">{error || 'Restaurant not found.'}</p>
        <Link to="/adminfuudr/restaurants" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600"><ArrowLeft size={16} /> Back to Restaurants</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {restaurant.logo_url ? (
          <img
            src={restaurant.logo_url}
            alt={restaurant.restaurant_name || 'Restaurant'}
            className="h-20 w-20 rounded-2xl border border-slate-100 bg-white object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <Store size={32} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{restaurant.restaurant_name || 'Restaurant'}</h1>
            {restaurant.is_poornima && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                <GraduationCap size={14} /> Inside Poornima
              </span>
            )}
          </div>
          <p className="mt-1 capitalize text-sm font-medium text-slate-500">
            {restaurant.restaurant_type || 'Restaurant'}
            {restaurant.avg_rating > 0 ? ` · ★ ${restaurant.avg_rating}` : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={togglingOpen}
          onClick={handleToggleOpen}
          className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
            restaurant.is_open !== false
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          } ${togglingOpen ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          title={restaurant.is_open !== false ? 'Click to turn OFF (Close)' : 'Click to turn ON (Open)'}
        >
          <span className={`w-2 h-2 rounded-full ${restaurant.is_open !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{restaurant.is_open !== false ? 'ON' : 'OFF'}</span>
          <span className="text-[11px] font-medium opacity-75">
            ({restaurant.is_open !== false ? 'Open' : 'Closed'})
          </span>
          {togglingOpen && <Loader2 size={11} className="animate-spin text-current ml-0.5" />}
        </button>
      </div>

      {/* KPIs */}
      <section aria-label="Restaurant KPIs" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Link
          to={`/adminfuudr/restaurants/${id}/orders`}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md"
        >
          <span className="inline-flex rounded-lg bg-orange-50 p-2 text-orange-600">
            <ShoppingBag size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">{kpis.totalOrders}</p>
          <p className="text-xs font-bold text-slate-600">Total Orders</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {kpis.todayOrders} today · {kpis.activeOrders} active
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <IndianRupee size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(kpis.sales)}</p>
          <p className="text-xs font-bold text-slate-600">Total Sales</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {kpis.deliveredOrders} delivered · {kpis.cancelledOrders} cancelled
          </p>
        </div>

        <Link
          to={`/adminfuudr/restaurants/${id}/menu`}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md"
        >
          <span className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-600">
            <UtensilsCrossed size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">{kpis.totalItems}</p>
          <p className="text-xs font-bold text-slate-600">Menu Items</p>
          <p className={`mt-1 text-[11px] font-medium ${kpis.outOfStock > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {kpis.inStock} in stock · {kpis.outOfStock} out
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="inline-flex rounded-lg bg-violet-50 p-2 text-violet-600">
            <Layers size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">{addonCount}</p>
          <p className="text-xs font-bold text-slate-600">Add-ons</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Accompaniments</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <span className="inline-flex rounded-lg bg-amber-50 p-2 text-amber-600">
            <Star size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {restaurant.avg_rating > 0 ? restaurant.avg_rating : '—'}
          </p>
          <p className="text-xs font-bold text-slate-600">Rating</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {restaurant.total_reviews || 0} reviews
          </p>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Recent Orders
            </h2>
            {orders.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                {orders.length} total
              </span>
            )}
          </div>
          {orders.length > 0 && (
            <Link
              to={`/adminfuudr/restaurants/${id}/orders`}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700"
            >
              <span>View all orders</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <OrdersTableView
          orders={orders.slice(0, 5)}
          emptyMessage="No orders yet"
          showRestaurant={false}
          basePath="/adminfuudr/orders"
        />
      </section>
    </div>
  );
}
