import { Outlet } from 'react-router-dom';
import { AdminNavigation } from './components/AdminNavigation';
import { useNewOrderNotification } from '../../hooks/useNewOrderNotification';
import { AdminToast } from '../../components/AdminToast';

export default function AdminFuudrLayout() {
  const { newOrder, closeToast } = useNewOrderNotification();
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <AdminNavigation />
      <div className="w-full min-w-0 max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <Outlet />
      </div>
      <AdminToast order={newOrder} onClose={closeToast} />
    </div>
  );
}
