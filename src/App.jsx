import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { AdminPortal } from './pages/AdminPortal/AdminPortal';
import { ProtectedRoute } from './pages/AdminPortal/ProtectedRoute';
import SignIn from './pages/Partner/SignIn';
import SignUp from './pages/Partner/SignUp';
import ProfileSetup from './pages/Partner/ProfileSetup';
import DashboardLayout from './pages/Partner/Dashboard/DashboardLayout';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
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
