import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Building2, Search, PlusCircle, MessageSquare, Shield, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-emerald-400 font-bold text-xl">
              <Building2 className="h-8 w-8 text-emerald-400" />
              <span>BUILDLOOP</span>
            </Link>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono hidden md:inline-block">
              List • Match • Collect
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/search" className="flex items-center space-x-1 text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              <Search className="h-4 w-4" />
              <span>Explore Materials</span>
            </Link>

            {user ? (
              <>
                {(user.role === 'SELLER' || user.role === 'ADMIN') && (
                  <Link to="/seller/create" className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-md text-sm font-medium">
                    <PlusCircle className="h-4 w-4" />
                    <span>Sell Material</span>
                  </Link>
                )}

                {user.role === 'SELLER' && (
                  <Link to="/seller/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                )}

                {user.role === 'RECYCLER' && (
                  <Link to="/recycler" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Recycler Hub
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 px-3 py-2 rounded-md text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link to="/chat" className="text-slate-300 hover:text-white p-2 rounded-full" title="Messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>

                <div className="flex items-center space-x-2 border-l border-slate-700 pl-4">
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded text-emerald-400 border border-slate-700">
                    {user.role}
                  </span>
                  <span className="text-sm font-medium text-slate-200 hidden sm:inline-block">{user.name}</span>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-1" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
