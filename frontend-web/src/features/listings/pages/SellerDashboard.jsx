import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { Link } from 'react-router-dom';
import { PlusCircle, Package, CheckCircle, Clock, Trash2, Eye } from 'lucide-react';

export const SellerDashboard = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    try {
      const data = await apiFetch('/listings/me');
      setListings(data);
    } catch (err) {
      console.error('Error fetching my listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleStatusChange = async (listingId, action) => {
    try {
      await apiFetch(`/listings/${listingId}/${action}`, { method: 'POST' });
      fetchMyListings();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await apiFetch(`/listings/${listingId}`, { method: 'DELETE' });
      fetchMyListings();
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  const activeCount = listings.filter(l => l.status === 'ACTIVE').length;
  const reservedCount = listings.filter(l => l.status === 'RESERVED').length;
  const soldCount = listings.filter(l => l.status === 'SOLD').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Demolition Site Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your active material listings, reservations, and sales history.</p>
        </div>
        <Link
          to="/seller/create"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-lg shadow-emerald-950"
        >
          <PlusCircle className="h-5 w-5" />
          <span>New Material Listing</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase">Active Listings</span>
            <span className="text-3xl font-bold text-white block">{activeCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-amber-950 border border-amber-800 rounded-lg text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase">Reserved Items</span>
            <span className="text-3xl font-bold text-white block">{reservedCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-950 border border-blue-800 rounded-lg text-blue-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase">Completed Sales</span>
            <span className="text-3xl font-bold text-white block">{soldCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Your Material Listings</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            You have not posted any material listings yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Material Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-bold text-white">{item.title}</td>
                    <td className="px-6 py-4">{item.category?.name} ({item.material_type})</td>
                    <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">₹{item.price}/{item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        item.status === 'RESERVED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/listings/${item.id}`} className="inline-block text-slate-400 hover:text-white p-1" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'reserve')}
                          className="text-xs bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 px-2.5 py-1 rounded"
                        >
                          Reserve
                        </button>
                      )}
                      {item.status === 'RESERVED' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'release')}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded"
                        >
                          Release
                        </button>
                      )}
                      {item.status !== 'SOLD' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'sold')}
                          className="text-xs bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded"
                        >
                          Mark Sold
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-block text-slate-500 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
