import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, ArrowLeft, Menu, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const navItems = [
  { name: 'Home',       icon: LayoutDashboard, path: '' },
  { name: 'Orders',     icon: ShoppingBag,     path: 'orders' },
  { name: 'Menu Items', icon: UtensilsCrossed,  path: 'menu' },
  { name: 'Settings',   icon: Settings,         path: 'settings' },
];

export default function RestaurantLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchRestaurant = async () => {
      try {
        const { data } = await supabase
          .rpc('admin_list_partners')
          .eq('id', id)
          .maybeSingle();
        if (active && data) setRestaurant(data);
      } catch {
        // Ignore; RestaurantDetails handles error display
      }
    };
    fetchRestaurant();
    return () => { active = false; };
  }, [id]);

  const base = `/restaurants/${id}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">

      {/* ── Top Header ── */}
      <header className="lg:col-span-2 sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="px-4 md:px-8 h-16 flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(o => !o)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Back link */}
          <button
            onClick={() => navigate('/restaurants')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">All Restaurants</span>
          </button>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside
        className={`${menuOpen ? 'block' : 'hidden'} fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200/80 bg-white shadow-sm lg:sticky lg:z-auto lg:block lg:h-[calc(100dvh-4rem)] lg:self-start lg:border-b-0 lg:border-r lg:shadow-none`}
      >
        {restaurant && (
          <div className="p-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.restaurant_name || 'Restaurant'}
                  className="w-10 h-10 rounded-full object-cover shadow-sm bg-white shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                  <span className="text-sm font-bold text-white">
                    {(restaurant.restaurant_name || 'R').charAt(0)}
                  </span>
                </div>
              )}
              <div className="overflow-hidden flex-1 min-w-0">
                <h2 className="font-bold text-xs text-slate-900 truncate leading-tight">
                  {restaurant.restaurant_name || 'Restaurant'}
                </h2>
                {(restaurant.owner_name || restaurant.restaurant_type) && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 capitalize">
                    {restaurant.owner_name || restaurant.restaurant_type}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ name, icon: Icon, path }) => {
            const to = path ? `${base}/${path}` : base;
            return (
              <NavLink
                key={name}
                to={to}
                end={!path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2 border-b border-slate-100 px-2.5 py-2 text-xs font-bold transition-colors rounded-lg ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={15} className="shrink-0" aria-hidden="true" />
                <span className="flex-1">{name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div className="w-full min-w-0 max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
