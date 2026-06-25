import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminNavbar } from './components/AdminNavbar';
import { useNewOrderNotification } from '../../hooks/useNewOrderNotification';
import { AdminToast } from '../../components/AdminToast';

export default function AdminFuudrLayout() {
  const { newOrder, closeToast } = useNewOrderNotification();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <AdminNavbar />
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        <Outlet />
      </div>
      <AdminToast order={newOrder} onClose={closeToast} />
    </div>
  );
}
