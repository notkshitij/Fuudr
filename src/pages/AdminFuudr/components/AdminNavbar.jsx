import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

const SESSION_KEY = 'fuudr_super_admin_auth';

export function AdminNavbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const fetchActive = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'preparing', 'on_the_way']);
      setLiveCount(count || 0);
    };
    fetchActive();

    const sub = supabase
      .channel('admin_navbar_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchActive)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    navigate('/adminfuudr');
    window.location.reload(); // force re-render to show login screen
  };

  const isActive = (path) => {
    if (path === '/adminfuudr' && location.pathname === '/adminfuudr') return true;
    if (path !== '/adminfuudr' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: 'Dashboard', path: '/adminfuudr',        icon: LayoutDashboard },
    { name: 'Orders',    path: '/adminfuudr/orders',  icon: ShoppingBag, badge: liveCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo + Brand */}
        <Link to="/adminfuudr" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105">
            <img src="/favicon.png" alt="Fuudr" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black text-slate-900 tracking-tight">Fuudr</span>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Super Admin</span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ name, path, icon: Icon, badge }) => {
            const active = isActive(path);
            return (
              <Link
                key={name}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{name}</span>
                {badge > 0 && (
                  <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black ${
                    active ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                  }`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>fuudr.com</span>
            <ChevronRight size={12} />
            <span className="text-slate-600">
              {location.pathname === '/adminfuudr'
                ? 'Dashboard'
                : location.pathname.includes('orders')
                ? 'Orders'
                : 'Admin'}
            </span>
          </div>

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
  );
}
