import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { ListingCard } from '../../listings/components/ListingCard';
import { MapView, loadGoogleMaps } from '../../../components/Map/MapView';
import { Search, MapPin, Filter, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const SearchPage = () => {
  const { user, setUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [addressInput, setAddressInput] = useState('Bangalore, India');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [radius, setRadius] = useState(20);
  const [viewMode, setMapViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);

  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946 });
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiFetch('/categories');
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let endpoint = `/search/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=${radius}`;
      if (selectedCategory) endpoint += `&category_id=${selectedCategory}`;
      if (selectedMaterialType) endpoint += `&material_type=${selectedMaterialType}`;

      const data = await apiFetch(endpoint);

      let filtered = data;
      if (query) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
        );
      }
      if (selectedCondition) {
        filtered = filtered.filter(item => item.condition === selectedCondition);
      }

      setListings(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [coords, selectedCategory, selectedMaterialType, selectedCondition, radius]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const handleAddressAutofillSearch = async () => {
    if (!addressInput.trim()) return;
    setLocationMessage('Searching address location on Google Maps...');
    try {
      const maps = await loadGoogleMaps();
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ address: addressInput }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          setCoords({ latitude: loc.lat(), longitude: loc.lng() });
          setAddressInput(results[0].formatted_address);
          setLocationMessage('Location set from address!');
        } else {
          setLocationMessage('Could not locate address.');
        }
      });
    } catch (err) {
      setLocationMessage('Geocoding service error.');
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support location sharing.');
      return;
    }
    setLocationMessage('Requesting GPS location…');
    navigator.geolocation.getCurrentPosition(async ({ coords: position }) => {
      const next = { latitude: position.latitude, longitude: position.longitude };
      setCoords(next);
      if (user) {
        try {
          const updated = await apiFetch('/users/me/location', {
            method: 'PUT',
            body: JSON.stringify({ ...next, location_sharing_enabled: true }),
          });
          setUser(updated);
          setLocationMessage('Location saved privately for search.');
        } catch (err) {
          setLocationMessage(err.message || 'Location found.');
        }
      } else {
        setLocationMessage('GPS location active.');
      }
    }, () => setLocationMessage('Location permission denied.'), {
      enableHighAccuracy: false, timeout: 10000, maximumAge: 300000,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-extrabold text-white mb-2">Discover Reusable & Recyclable Materials</h1>
        <p className="text-slate-400">Search materials around your demolition site or construction project radius.</p>

        {/* Address Location Search Row */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 flex items-center space-x-2 w-full">
            <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Enter search city or site address (e.g. Indiranagar, Bangalore)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddressAutofillSearch}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-xs shrink-0"
            >
              Autofill Location
            </button>
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2.5 rounded-lg shrink-0 w-full md:w-auto justify-center"
          >
            <MapPin className="h-4 w-4 text-emerald-400" /> Use GPS Location
          </button>
        </div>

        {locationMessage && <p className="text-xs text-emerald-400 font-medium">{locationMessage}</p>}

        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search steel beams, bricks, timber, concrete..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition"
          >
            <span>Search Materials</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 h-fit space-y-6">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-slate-800 pb-3">
            <Filter className="h-5 w-5" />
            <span>Refine Search</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Material Radius ({radius} km)</label>
            <input
              type="range"
              min="5"
              max="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Classification</label>
            <select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
            >
              <option value="">All Types (Reusable & Recyclable)</option>
              <option value="REUSABLE">Reusable Materials</option>
              <option value="RECYCLABLE">Recyclable Waste</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
            >
              <option value="">Any Condition</option>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-3 rounded-lg">
            <span className="text-slate-300 text-sm font-medium">
              Showing <strong className="text-white">{listings.length}</strong> available material listings
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setMapViewMode('grid')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Grid View
              </button>
              <button
                onClick={() => setMapViewMode('map')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${viewMode === 'map' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                Map View
              </button>
            </div>
          </div>

          {viewMode === 'map' ? (
            <MapView listings={listings} userLocation={coords} />
          ) : (
            loading ? (
              <div className="text-center py-12 text-slate-400">Searching nearby materials...</div>
            ) : listings.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
                <p className="text-slate-400 text-lg">No materials found matching your filters.</p>
                <p className="text-slate-500 text-sm mt-2">Try expanding your search radius or clearing material filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
