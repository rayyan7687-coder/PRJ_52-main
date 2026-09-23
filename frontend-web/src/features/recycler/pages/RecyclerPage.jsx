import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { ListingCard } from '../../listings/components/ListingCard';
import { Recycle, MapPin, Truck, Factory } from 'lucide-react';

export const RecyclerPage = () => {
  const [recyclables, setRecyclables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecyclables = async () => {
      try {
        const data = await apiFetch('/listings?material_type=RECYCLABLE');
        setRecyclables(data);
      } catch (err) {
        console.error('Error fetching recyclables:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecyclables();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/50 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/80 border border-emerald-700 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
            <Factory className="h-4 w-4" />
            <span>Industrial Recycling Discovery</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Nearby Recyclable Material Streams</h1>
          <p className="text-slate-300 max-w-2xl">
            Source bulk scrap steel, crushed concrete waste, timber debris, and industrial plastics directly from demolition sites.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
          <Truck className="h-8 w-8 text-emerald-400" />
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Bulk Logistics</span>
            <span className="text-sm font-bold text-white">Direct Pickup Dispatch</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Recycle className="h-5 w-5 text-emerald-400" />
            <span>Available Waste Batches ({recyclables.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading recyclable waste streams...</div>
        ) : recyclables.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            No recyclable waste listings available currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recyclables.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
