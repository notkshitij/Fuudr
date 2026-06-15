import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { AdminPortal } from './pages/AdminPortal/AdminPortal';
import { ProtectedRoute } from './pages/AdminPortal/ProtectedRoute';
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
      </Routes>
    </BrowserRouter>
  );
}
