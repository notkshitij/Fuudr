import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { ProtectedRoute } from './pages/AdminPortal/ProtectedRoute';
import { SuperAdminRoute } from './pages/AdminFuudr/components/SuperAdminRoute';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

// Synchronous imports to allow proper static HTML pre-rendering
import { AdminPortal } from './pages/AdminPortal/AdminPortal';
import SignIn from './pages/Partner/SignIn';
import SignUp from './pages/Partner/SignUp';
import ProfileSetup from './pages/Partner/ProfileSetup';
import DashboardLayout from './pages/Partner/Dashboard/DashboardLayout';
import AdminFuudrLayout from './pages/AdminFuudr/AdminFuudrLayout';
import AdminFuudr from './pages/AdminFuudr/AdminFuudr';
import OrdersList from './pages/AdminFuudr/OrdersList';
import ManageOrder from './pages/AdminFuudr/ManageOrder';
import Privacy from './pages/Privacy/Privacy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import DeleteAccount from './pages/DeleteAccount/DeleteAccount';
import { BlogList } from './pages/Blog/BlogList';
import { BlogPost } from './pages/Blog/BlogPost';

// A premium Brutalist-styled fallback loader that matches the application's design language
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-[var(--bg-light)] font-[var(--sans)] text-[var(--fg)]">
      <div className="flex flex-col items-center gap-5 p-8 border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] bg-white">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[var(--acc)] animate-spin" />
        <span className="font-[var(--xl)] text-lg uppercase tracking-wider text-black">Loading TasteBite...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Legal */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/delete-account" element={<DeleteAccount />} />

          {/* Blog Content System */}
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Super Admin — password protected */}
          <Route path="/adminfuudr" element={
            <SuperAdminRoute>
              <AdminFuudrLayout />
            </SuperAdminRoute>
          }>
            <Route index element={<AdminFuudr />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:id" element={<ManageOrder />} />
          </Route>

          <Route path="/fuudr-backstage" element={
            <ProtectedRoute>
              <AdminPortal />
            </ProtectedRoute>
          } />

          {/* Partner Portal Routes */}
          <Route path="/partner" element={<SignIn />} />
          <Route path="/partner/signup" element={<SignUp />} />
          <Route path="/partner/setup-profile" element={<ProfileSetup />} />
          <Route path="/partner/dashboard/*" element={<DashboardLayout />} />
        </Routes>
      </Suspense>
    </>
  );
}

