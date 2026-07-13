import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { ProtectedRoute } from './pages/AdminPortal/ProtectedRoute';
import { SuperAdminRoute } from './pages/AdminFuudr/components/SuperAdminRoute';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

// Lazy load route pages to improve initial load time and reduce chunk size
const AdminPortal = lazy(() => import('./pages/AdminPortal/AdminPortal').then(module => ({ default: module.AdminPortal })));
const SignIn = lazy(() => import('./pages/Partner/SignIn'));
const SignUp = lazy(() => import('./pages/Partner/SignUp'));
const ProfileSetup = lazy(() => import('./pages/Partner/ProfileSetup'));
const DashboardLayout = lazy(() => import('./pages/Partner/Dashboard/DashboardLayout'));
const AdminFuudrLayout = lazy(() => import('./pages/AdminFuudr/AdminFuudrLayout'));
const AdminFuudr = lazy(() => import('./pages/AdminFuudr/AdminFuudr'));
const OrdersList = lazy(() => import('./pages/AdminFuudr/OrdersList'));
const ManageOrder = lazy(() => import('./pages/AdminFuudr/ManageOrder'));
const Privacy = lazy(() => import('./pages/Privacy/Privacy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService/TermsOfService'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount/DeleteAccount'));

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
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Legal */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/delete-account" element={<DeleteAccount />} />

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
    </BrowserRouter>
  );
}

