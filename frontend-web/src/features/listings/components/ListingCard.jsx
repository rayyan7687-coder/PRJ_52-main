import React from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ListingCard = ({ listing }) => {
  const primaryImage = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=60';

  return (
    <Link to={`/listings/${listing.id}`} className="group bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg hover:border-emerald-500/50 transition duration-200 flex flex-col">
      <div className="relative h-48 bg-slate-800 overflow-hidden">
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=60';
          }}
        />
        <div className="absolute top-2 left-2 flex space-x-1">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
            listing.material_type === 'REUSABLE' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700' : 'bg-amber-900/90 text-amber-300 border border-amber-700'
          }`}>
            {listing.material_type}
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-900/90 text-slate-300 border border-slate-700">
            {listing.condition}
          </span>
        </div>
        {listing.distance_km !== undefined && (
          <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur text-emerald-400 text-xs px-2 py-1 rounded border border-slate-700 flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{listing.distance_km} km away</span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">{listing.title}</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Grade {listing.grade || 'N/A'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{listing.description || 'No description provided.'}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-emerald-400 font-bold text-xl">₹{listing.price}</span>
            <span className="text-slate-400 text-xs font-normal"> / {listing.unit}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">{listing.quantity} {listing.unit} available</span>
            <span className="text-xs text-slate-500 block">{listing.seller?.name || 'Verified Seller'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
