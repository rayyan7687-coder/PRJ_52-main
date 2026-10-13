import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { HomePage } from './features/home/pages/HomePage';
import { SearchPage } from './features/search/pages/SearchPage';
import { ListingDetailsPage } from './features/listings/pages/ListingDetailsPage';
import { CreateListingPage } from './features/listings/pages/CreateListingPage';
import { SellerDashboard } from './features/listings/pages/SellerDashboard';
import { RecyclerPage } from './features/recycler/pages/RecyclerPage';
import { ChatPage } from './features/chat/pages/ChatPage';
import { AdminPage } from './features/admin/pages/AdminPage';
import { TermsPage } from './pages/TermsPage';

export const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />

        <Route
          path="/seller/create"
          element={
            <ProtectedRoute allowedRoles={['SELLER', 'CONTRACTOR_BUILDER', 'ADMIN']}>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SELLER', 'CONTRACTOR_BUILDER', 'ADMIN']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recycler"
          element={
            <ProtectedRoute allowedRoles={['RECYCLER', 'ADMIN']}>
              <RecyclerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
