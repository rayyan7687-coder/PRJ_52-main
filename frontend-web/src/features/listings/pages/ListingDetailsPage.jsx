import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { MapPin, Phone, MessageSquare, CheckCircle, Heart, ArrowLeft, User } from 'lucide-react';

export const ListingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await apiFetch(`/listings/${id}`);
        setListing(data);
      } catch (err) {
        setError('Failed to load listing details.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const conv = await apiFetch('/conversations', {
        method: 'POST',
        body: JSON.stringify({ listing_id: listing.id })
      });
      navigate(`/chat?conversation_id=${conv.id}`);
    } catch (err) {
      setActionMessage(err.message || 'Error initializing conversation');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorited) {
        await apiFetch(`/listings/${listing.id}/favorite`, { method: 'DELETE' });
        setIsFavorited(false);
        setActionMessage('Removed from favorites.');
      } else {
        await apiFetch(`/listings/${listing.id}/favorite`, { method: 'POST' });
        setIsFavorited(true);
        setActionMessage('Saved to favorites!');
      }
    } catch (err) {
      setActionMessage(err.message || 'Failed to update favorite status');
    }
  };

  const handleReserve = async () => {
    try {
      const updated = await apiFetch(`/listings/${listing.id}/reserve`, { method: 'POST' });
      setListing(updated);
      setActionMessage('Material reserved successfully!');
    } catch (err) {
      setActionMessage(err.message || 'Failed to reserve listing');
    }
  };

  const handleMarkSold = async () => {
    try {
      const updated = await apiFetch(`/listings/${listing.id}/sold`, { method: 'POST' });
      setListing(updated);
      setActionMessage('Listing marked as sold!');
    } catch (err) {
      setActionMessage(err.message || 'Failed to mark listing as sold');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading listing...</div>;
  if (error || !listing) return <div className="text-center py-20 text-red-400">{error || 'Listing not found'}</div>;

  const primaryImage = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';

  const isSeller = user && user.id === listing.seller_id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to search</span>
      </button>

      {actionMessage && (
        <div className="mb-6 bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="h-96 bg-slate-800 relative">
              <img
                src={primaryImage}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  {listing.material_type}
                </span>
                <span className="bg-slate-900/90 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                  Status: {listing.status}
                </span>
              </div>
              <button
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 p-2.5 rounded-full text-red-400 border border-slate-700 shadow"
                title="Favorite"
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h1 className="text-3xl font-extrabold text-white">{listing.title}</h1>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">{listing.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Condition</span>
                <span className="text-sm font-bold text-emerald-400">{listing.condition}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Grade</span>
                <span className="text-sm font-bold text-emerald-400">{listing.grade || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Quantity</span>
                <span className="text-sm font-bold text-white">{listing.quantity} {listing.unit}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Negotiable</span>
                <span className="text-sm font-bold text-white">{listing.is_negotiable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Asking Price</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-4xl font-black text-emerald-400">₹{listing.price}</span>
                <span className="text-slate-400">/ {listing.unit}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center space-x-3 text-slate-300 text-sm">
                <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>{listing.location_text || 'Whitefield, Bangalore'}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300 text-sm">
                <User className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Seller: {listing.seller?.name || 'Verified Supplier'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              {isSeller ? (
                <>
                  <button
                    onClick={handleReserve}
                    disabled={listing.status !== 'ACTIVE'}
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-lg transition"
                  >
                    Reserve Listing
                  </button>
                  <button
                    onClick={handleMarkSold}
                    disabled={listing.status === 'SOLD'}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-lg transition"
                  >
                    Mark as Sold
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartChat}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Chat with Seller</span>
                  </button>

                  <a
                    href={`tel:${listing.seller?.phone || '+919876543210'}`}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition"
                  >
                    <Phone className="h-5 w-5 text-emerald-400" />
                    <span>Call Seller</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
