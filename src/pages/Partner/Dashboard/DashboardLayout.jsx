import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  LogOut,
  Menu as MenuIcon,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import Overview from './Overview';
import MenuManager from './MenuManager';
import Settings from './Settings';

const DashboardLayout = () => {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('partnerUser');
    if (!storedUser) {
      navigate('/partner');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('partnerUser');
    navigate('/partner');
  };

  if (!user) return null;

  const navItems = [
    { name: 'Overview', path: '/partner/dashboard', icon: LayoutDashboard },
    { name: 'Menu', path: '/partner/dashboard/menu', icon: UtensilsCrossed },
    { name: 'Settings', path: '/partner/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex font-outfit text-slate-900">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:rounded-r-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${isMobileMenuOpen ? 'translate-x-0 rounded-r-3xl' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white rounded-tr-3xl lg:rounded-none">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              Fuudr <span className="text-orange-500 ml-1.5 font-bold">Partner</span>
            </span>
          </div>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:shadow-sm">
            {user.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/20">
                <span className="text-xl font-bold text-white">
                  {user.restaurant_name.charAt(0)}
                </span>
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <h2 className="font-bold text-sm text-slate-900 truncate leading-tight">{user.restaurant_name}</h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.owner_name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Main Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/partner/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
                }`}
              >
                <item.icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors duration-300" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header for Mobile */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <MenuIcon size={24} />
            </button>
            <span className="font-bold text-lg">{user.restaurant_name}</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 min-h-0 overflow-hidden bg-slate-50 p-4 lg:p-8 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col">
            <Routes>
              <Route path="/" element={<Overview user={user} />} />
              <Route path="/menu" element={<MenuManager user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
            </Routes>
          </div>
        </main>
      </div>
      
    </div>
  );
};

export default DashboardLayout;
