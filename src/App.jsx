import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { AdminPortal } from './pages/AdminPortal/AdminPortal';
import { ProtectedRoute } from './pages/AdminPortal/ProtectedRoute';
import SignIn from './pages/Partner/SignIn';
import SignUp from './pages/Partner/SignUp';
import ProfileSetup from './pages/Partner/ProfileSetup';
import DashboardLayout from './pages/Partner/Dashboard/DashboardLayout';
import AdminFuudrLayout from './pages/AdminFuudr/AdminFuudrLayout';
import AdminFuudr from './pages/AdminFuudr/AdminFuudr';
import OrdersList from './pages/AdminFuudr/OrdersList';
import ManageOrder from './pages/AdminFuudr/ManageOrder';
import { SuperAdminRoute } from './pages/AdminFuudr/components/SuperAdminRoute';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Legal */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

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
    </BrowserRouter>
  );
}
