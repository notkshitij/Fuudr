import React, { useEffect, useState } from 'react';
import { 
  UtensilsCrossed, 
  Star,
  Plus,
  ArrowRight,
  Store,
  Layers,
  Settings as SettingsIcon,
  Sparkles,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { Link } from 'react-router-dom';

const Overview = ({ user }) => {
  const [stats, setStats] = useState({
    menuItems: 0,
    inStockCount: 0,
    outOfStockCount: 0,
    addonCount: 0,
    avgRating: null,
    totalReviews: 0
  });
  const [recentDishes, setRecentDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch menu items for count, stock breakdown, and recent dishes preview
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('id, name, price, is_in_stock, category_name, image_url, reels(video_url), created_at')
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false });

        const items = menuData || [];
        const inStock = items.filter(i => i.is_in_stock !== false).length;
        const outOfStock = items.length - inStock;
        setRecentDishes(items.slice(0, 4));

        // Fetch partner details (avg rating, total reviews, is_open)
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('google_rating, google_review_count, avg_rating, total_reviews, is_open, opening_time, closing_time')
          .eq('id', user.id)
          .single();

        if (partnerError) throw partnerError;

        // Fetch accompaniments / addons count
        let addonCount = 0;
        try {
          const { count } = await supabase
            .from('dish_addons')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', user.id);
          addonCount = count || 0;
        } catch {
          // Graceful fallback if addons table empty
        }

        setStats({
          menuItems: items.length,
          inStockCount: inStock,
          outOfStockCount: outOfStock,
          addonCount: addonCount,
          avgRating: partnerData?.google_rating ?? partnerData?.avg_rating ?? null,
          totalReviews: partnerData?.google_review_count ?? partnerData?.total_reviews ?? 0
        });

        // Default to true if column is null
        setIsOpen(partnerData?.is_open !== false);
      } catch (err) {
        console.error("Error fetching overview stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);

  const handleToggle = async () => {
    const newValue = !isOpen;
    setToggleLoading(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_open: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setIsOpen(newValue);
    } catch (err) {
      console.error('Failed to update store status:', err);
      // Revert on error
      setIsOpen(isOpen);
    } finally {
      setToggleLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Dishes', 
      value: stats.menuItems, 
      subtext: stats.outOfStockCount > 0 ? `${stats.outOfStockCount} out of stock` : 'All in stock',
      isWarning: stats.outOfStockCount > 0,
      icon: UtensilsCrossed, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10',
      link: '/partner/dashboard/menu'
    },
    { 
      title: 'Add-ons', 
      value: stats.addonCount, 
      subtext: 'Sides & extras',
      isWarning: false,
      icon: Layers, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      link: '/partner/dashboard/addons'
    },
    { 
      title: 'Rating', 
      value: stats.avgRating ? `${stats.avgRating}★` : 'New', 
      subtext: 'Google score',
      isWarning: false,
      icon: Star, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      link: '/partner/dashboard/settings'
    },
    { 
      title: 'Reviews', 
      value: stats.totalReviews, 
      subtext: 'From customers',
      isWarning: false,
      icon: CheckCircle2, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      link: '/partner/dashboard/settings'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Menu',
      subtitle: 'Dishes & live stock',
      icon: UtensilsCrossed,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      hoverBorder: 'hover:border-orange-400',
      link: '/partner/dashboard/menu'
    },
    {
      title: 'Add Dish',
      subtitle: 'Photo or reel upload',
      icon: PlusCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      hoverBorder: 'hover:border-emerald-400',
      link: '/partner/dashboard/menu'
    },
    {
      title: 'Add-ons',
      subtitle: 'Sides & extras',
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hoverBorder: 'hover:border-blue-400',
      link: '/partner/dashboard/addons'
    },
    {
      title: 'Settings',
      subtitle: 'Hours & profile',
      icon: SettingsIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      hoverBorder: 'hover:border-purple-400',
      link: '/partner/dashboard/settings'
    }
  ];

  return (
    <div className="animate-fadeIn pb-10">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-7 shadow-xl mb-4 sm:mb-6 border border-slate-700/50">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Label */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-orange-300 text-[11px] font-semibold mb-2.5">
            <Sparkles size={12} className="text-orange-400" />
            <span>Partner Dashboard</span>
          </div>

          {/* Title row: text left, button right */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Welcome back, {user.owner_name} 👋
              </h1>
              <p className="text-slate-300 text-[11px] sm:text-sm font-medium mt-0.5">
                {user.restaurant_name} overview for today.
              </p>
            </div>

            {/* Single compact Add Dish button — always visible */}
            <Link 
              to="/partner/dashboard/menu" 
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-orange-500/25 whitespace-nowrap"
            >
              <Plus size={15} /> 
              <span>Add Dish</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Store Status Operational Card */}
      {isOpen !== null && (
        <div className={`mb-5 sm:mb-6 rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
          isOpen 
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-500/30' 
            : 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isOpen ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
              }`}>
                <Store size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 shrink-0">Store Status</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {isOpen 
                    ? 'Live — customers can discover & order.' 
                    : 'Paused — not accepting orders.'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggleLoading}
              className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none p-0.5 shrink-0 ${
                toggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
              } ${isOpen ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-300'}`}
              aria-label="Toggle store status"
              title={isOpen ? "Click to close store" : "Click to open store"}
            >
              <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                isOpen ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Stock Alert Banner (Dynamic) */}
      {stats.outOfStockCount > 0 && (
        <div className="mb-4 sm:mb-5 bg-amber-50 border border-amber-300/60 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-amber-900 leading-snug">
                {stats.outOfStockCount} dish{stats.outOfStockCount > 1 ? 'es' : ''} out of stock
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">Customers see these as unavailable.</p>
              <Link 
                to="/partner/dashboard/menu" 
                className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
              >
                Review Stock <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics / KPI Grid: 2x2 on mobile, 4-col on desktop */}
      {loading ? (
        <div className="flex justify-center items-center h-32 mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
          {statCards.map((stat, index) => (
            <Link 
              key={index} 
              to={stat.link}
              className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col group active:scale-[0.98] shadow-sm gap-3"
            >
              {/* Icon top-left, no text alongside it */}
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 self-start`}>
                <stat.icon className={stat.color} size={17} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                  {stat.value}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mb-0.5">{stat.title}</p>
                <p className={`text-[10px] font-semibold leading-snug ${stat.isWarning ? 'text-rose-500' : 'text-slate-400'}`}>
                  {stat.subtext}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions Hub */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Quick Actions</h2>
          <span className="hidden sm:block text-xs text-slate-400 font-medium">Manage your restaurant</span>
        </div>

        {/* Horizontal scrollable row */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className={`group bg-white flex-none w-36 sm:w-44 p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:shadow-md ${action.hoverBorder} transition-all flex flex-col active:scale-[0.97] shadow-sm snap-start`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110 mb-3 self-start shrink-0`}>
                <action.icon size={17} className={action.color} />
              </div>

              {/* Title & subtitle */}
              <h3 className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-orange-600 transition-colors leading-snug">
                {action.title}
              </h3>
              <p className="text-slate-400 text-[11px] font-medium line-clamp-2 flex-1 leading-snug">
                {action.subtitle}
              </p>

              {/* Footer arrow */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors">Go</span>
                <ArrowRight size={13} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Menu Preview / Live Dishes Snapshot */}
      {recentDishes.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Dishes</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Latest items on your menu</p>
            </div>
            <Link 
              to="/partner/dashboard/menu"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group shrink-0"
            >
              <span>All ({stats.menuItems})</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentDishes.map((dish) => {
              const inStock = dish.is_in_stock !== false;
              const hasVideo = dish.reels && dish.reels.length > 0 && dish.reels[0].video_url;

              return (
                <Link
                  key={dish.id}
                  to="/partner/dashboard/menu"
                  className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] bg-slate-200 overflow-hidden">
                    {hasVideo ? (
                      <video 
                        src={dish.reels[0].video_url} 
                        poster={dish.image_url || undefined}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        muted 
                        playsInline
                      />
                    ) : dish.image_url ? (
                      <img 
                        src={dish.image_url} 
                        alt={dish.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UtensilsCrossed size={24} />
                      </div>
                    )}

                    {/* Stock pill badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm ${
                        inStock ? 'bg-emerald-500/90 text-white' : 'bg-rose-600/90 text-white'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-white' : 'bg-rose-200 animate-pulse'}`} />
                        {inStock ? 'In Stock' : 'Out'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider truncate mb-0.5">
                        {dish.category_name}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                        {dish.name}
                      </h4>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">₹{dish.price}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-orange-600 font-semibold flex items-center gap-0.5">
                        Edit <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Overview;
