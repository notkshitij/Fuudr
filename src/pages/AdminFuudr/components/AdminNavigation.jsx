import { useEffect, useState } from 'react';
import { Link, NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Store, ChevronRight, LogOut, Menu, X, BarChart3, Settings, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const SESSION_KEY = 'fuudr_super_admin_auth';

export function AdminNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const fetchActive = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['placed', 'preparing', 'prepared', 'on_the_way']);
      setLiveCount(count || 0);
    };
    fetchActive();

    const sub = supabase
      .channel('admin_navbar_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchActive)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/adminfuudr');
  };

  const navItems = [
    { name: 'Dashboard',   path: '/adminfuudr',             icon: LayoutDashboard },
    { name: 'Orders',      path: '/adminfuudr/orders',       icon: ShoppingBag, badge: liveCount },
    { name: 'Statistics', path: '/adminfuudr/statistics', icon: BarChart3 },
    { name: 'Restaurants', path: '/adminfuudr/restaurants', icon: Store },
    { name: 'Settings', path: '/adminfuudr/settings', icon: Settings },
  ];

  const currentPage = navItems.find(({ path }) =>
    matchPath({ path, end: path === '/adminfuudr' }, location.pathname)
  );

  const orderMatch = matchPath({ path: '/adminfuudr/orders/:id', end: true }, location.pathname);
  const orderId = orderMatch?.params?.id;

  return (
    <>
      <header className="lg:col-span-2 sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'}
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden shrink-0"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo + Brand */}
            <Link to="/adminfuudr" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 shrink-0 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105">
                <img src="/favicon.png" alt="Fuudr" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-slate-900 tracking-tight">Fuudr</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Super Admin</span>
              </div>
            </Link>

            {/* Order Navbar Breadcrumb */}
            {orderId && (
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pl-1 sm:pl-3">
                <div className="h-6 w-px bg-slate-200 shrink-0" />
                <button
                  type="button"
                  onClick={() => navigate('/adminfuudr/orders')}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                  title="Back to Orders"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                  <Link to="/adminfuudr/orders" className="text-slate-400 hover:text-slate-700 shrink-0">
                    Orders
                  </Link>
                  <ChevronRight size={14} className="shrink-0 text-slate-400" />
                  <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate">
                    #{orderId}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {orderId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('admin:print-receipt'))}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-sm"
                  title="Print Receipt"
                >
                  <Printer size={15} className="shrink-0 text-slate-700" />
                  <span className="hidden sm:inline">Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('admin:delete-order'))}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-full font-bold text-xs sm:text-sm hover:bg-rose-100 transition-all shadow-sm"
                  title="Delete Order"
                >
                  <Trash2 size={15} className="shrink-0 text-rose-600" />
                  <span className="hidden sm:inline">Delete Order</span>
                </button>
              </div>
            )}

            {/* Breadcrumb */}
            {!orderId && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>fuudr.com</span>
                <ChevronRight size={12} />
                <span className="text-slate-600">
                  {currentPage?.name ?? 'Admin'}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
              title="Logout"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      <aside
        id="admin-sidebar"
        className={`${menuOpen ? 'block' : 'hidden'} fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200/80 bg-white shadow-sm lg:sticky lg:z-auto lg:block lg:h-[calc(100dvh-4rem)] lg:self-start lg:border-b-0 lg:border-r lg:shadow-none`}
      >
        <nav aria-label="Super Admin" className="flex flex-col gap-1 p-2">
          {navItems.map(({ name, path, icon: Icon, badge }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/adminfuudr'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `flex min-h-11 items-center gap-2 border-b border-slate-100 px-2.5 py-2 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  <span className="flex-1">{name}</span>
                  {badge > 0 && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black ${
                      isActive ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                    }`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
