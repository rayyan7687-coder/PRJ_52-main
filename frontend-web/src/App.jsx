import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar/Navbar';
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

export const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/seller/create" element={<CreateListingPage />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/recycler" element={<RecyclerPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
};

export default App;
