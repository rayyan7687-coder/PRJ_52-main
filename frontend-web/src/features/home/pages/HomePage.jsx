import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../services/api';
import { ListingCard } from '../../listings/components/ListingCard';
import { useAuth } from '../../auth/AuthContext';
import { Building2, Search, Recycle, MapPin, ArrowRight, ShieldCheck, Factory, PlusCircle } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const [reusableListings, setReusableListings] = useState([]);
  const [recyclableListings, setRecyclableListings] = useState([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const reusables = await apiFetch('/listings?material_type=REUSABLE');
        setReusableListings(reusables.slice(0, 4));

        const recyclables = await apiFetch('/listings?material_type=RECYCLABLE');
        setRecyclableListings(recyclables.slice(0, 4));
      } catch (err) {
        console.error('Error loading home data:', err);
      }
    };
    loadHomeData();
  }, []);

  const isRecycler = user && user.role === 'RECYCLER';

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-20 pb-16 border-b border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Circularity Marketplace for Construction & Demolition</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            {isRecycler ? (
              <>Source Bulk <span className="text-emerald-400">Recyclable Waste</span> Streams</>
            ) : (
              <>Recover. Reuse. <span className="text-emerald-400">Rebuild.</span></>
            )}
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl">
            {isRecycler
              ? 'BuildLoop provides recyclers direct access to scrap steel, crushed concrete, and biomass waste from demolition sites.'
              : 'BuildLoop empowers contractors and builders to sell extra leftover materials and buy reusable materials from other sites.'}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {isRecycler ? (
              <Link to="/recycler" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950">
                <Recycle className="h-5 w-5" />
                <span>Browse Recyclable Waste Streams</span>
              </Link>
            ) : (
              <>
                <Link to="/search" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950">
                  <Search className="h-5 w-5" />
                  <span>Buy Extra Leftover Materials</span>
                </Link>
                <Link to="/seller/create" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-8 py-3.5 rounded-lg flex items-center justify-center space-x-2 transition">
                  <PlusCircle className="h-5 w-5 text-emerald-400" />
                  <span>Sell Extra Leftover Material</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recycler View: Only Recyclable Items */}
      {isRecycler ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Factory className="h-6 w-6 text-emerald-400" />
                <span>Available Recyclable Batches for Purchase</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Direct from site clearance and demolition operations</p>
            </div>
            <Link to="/recycler" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center space-x-1">
              <span>View All Recyclables</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recyclableListings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-400">
              No recyclable materials currently listed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recyclableListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Contractor / Builder View: Reusable & Extra Leftover Materials */
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-emerald-400" />
                  <span>Contractor Leftover Materials</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">Reusable I-beams, bricks, timber, and surplus site supplies</p>
              </div>
              <Link to="/search" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center space-x-1">
                <span>Explore All</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {reusableListings.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-400">
                No active reusable listings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reusableListings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            )}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Recycle className="h-6 w-6 text-emerald-400" />
                  <span>Demolition Recyclable Streams</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">Bulk scrap steel, crushed aggregate, and waste streams</p>
              </div>
              <Link to="/recycler" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center space-x-1">
                <span>Recycler Hub</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recyclableListings.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
