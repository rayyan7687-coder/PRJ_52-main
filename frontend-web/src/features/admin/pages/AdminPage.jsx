import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { Shield, UserX, UserCheck, AlertTriangle, EyeOff } from 'lucide-react';

export const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [uData, rData] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/reports')
      ]);
      setUsers(uData);
      setReports(rData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleBlock = async (userId, isBlocked) => {
    const action = isBlocked ? 'unblock' : 'block';
    try {
      await apiFetch(`/admin/users/${userId}/${action}`, { method: 'PUT' });
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleHideListing = async (listingId) => {
    try {
      await apiFetch(`/admin/listings/${listingId}/hide`, { method: 'PUT' });
      alert('Listing hidden successfully.');
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading admin console...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Shield className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">Marketplace Moderation Console</h1>
          <p className="text-slate-400 text-sm">Manage user accounts, block malicious users, and review flagged material listings.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">User Accounts ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs">{u.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      {u.is_active ? 'ACTIVE' : 'BLOCKED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleBlock(u.id, !u.is_active)}
                      className={`text-xs font-bold px-3 py-1.5 rounded flex items-center space-x-1 ml-auto ${
                        u.is_active ? 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-800' : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {u.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      <span>{u.is_active ? 'Block User' : 'Unblock'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Flagged Listing Reports ({reports.length})</h2>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active reports.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {reports.map((r) => (
              <div key={r.id} className="p-6 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="font-bold text-white">Reason: {r.reason}</span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Listing #{r.listing_id}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{r.description || 'No description provided.'}</p>
                </div>

                <button
                  onClick={() => handleHideListing(r.listing_id)}
                  className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold px-3 py-1.5 rounded flex items-center space-x-1"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide Listing</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
