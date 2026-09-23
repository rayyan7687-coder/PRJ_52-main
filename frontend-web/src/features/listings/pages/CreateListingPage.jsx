import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, MapPin, Check, ArrowRight, ArrowLeft, X, Search, Image as ImageIcon, Sparkles } from 'lucide-react';
import { MapView, loadGoogleMaps } from '../../../components/Map/MapView';

// Utility to compress image to base64 Data URL
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geocodingMsg, setGeocodingMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    quantity: '',
    unit: 'kg',
    condition: 'GOOD',
    grade: 'B',
    price: '',
    is_negotiable: true,
    latitude: 12.9716,
    longitude: 77.5946,
    location_text: 'Whitefield, Bangalore, Karnataka',
    images: []
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiFetch('/categories');
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Image Upload and Camera Capture Handler
  const handlePhotoFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    try {
      const compressed = await Promise.all(
        files.map(f => compressImage(f))
      );
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...compressed]
      }));
    } catch (err) {
      console.error('Photo processing failed:', err);
      setError('Failed to process uploaded photo. Please try another image file.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePhotoFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  // Address Geocoding and Location Selection
  const handleAddressAutofill = async () => {
    if (!formData.location_text.trim()) return;
    setGeocodingMsg('Locating site address on Google Maps...');
    try {
      const maps = await loadGoogleMaps();
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ address: formData.location_text }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          setFormData(prev => ({
            ...prev,
            latitude: loc.lat(),
            longitude: loc.lng(),
            location_text: results[0].formatted_address
          }));
          setGeocodingMsg('Address located and map pinned!');
        } else {
          setGeocodingMsg('Address not found automatically. Click on the map below to pinpoint site.');
        }
      });
    } catch (err) {
      setGeocodingMsg('Geocoding service unavailable. Click on the map below to pinpoint site.');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeocodingMsg('Geolocation not supported by browser.');
      return;
    }
    setGeocodingMsg('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFormData(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_text: `Current Site GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
        }));
        setGeocodingMsg('GPS coordinates detected and updated!');
      },
      () => setGeocodingMsg('Location permission denied. Click on the map to select site.')
    );
  };

  const selectMapLocation = ({ latitude, longitude }) => {
    setFormData((current) => ({
      ...current,
      latitude,
      longitude,
      location_text: `Pinned Site Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
    }));
    setGeocodingMsg('Location updated from map pin!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.images.length === 0) {
      setError('Please upload or capture at least one real photograph of the material.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id, 10),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      const res = await apiFetch('/listings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      navigate(`/listings/${res.id}`);
    } catch (err) {
      setError(err.message || 'Failed to publish material listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">List Extra Leftover or Demolition Material</h1>
        <p className="text-slate-400 mt-1">Connect directly with nearby contractors, builders, and recyclers.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4 text-sm font-semibold">
        <span className={step >= 1 ? 'text-emerald-400' : 'text-slate-500'}>1. Details</span>
        <span className={step >= 2 ? 'text-emerald-400' : 'text-slate-500'}>2. Photo Capture & Location</span>
        <span className={step >= 3 ? 'text-emerald-400' : 'text-slate-500'}>3. Preview & Submit</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Listing Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Recovered Structural Steel I-Beams (ISMB 300)"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.material_type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
                >
                  <option value="NEW">NEW</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="POOR">POOR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  required
                  placeholder="1500"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Unit</label>
                <input
                  type="text"
                  name="unit"
                  required
                  placeholder="kg / tons / pieces"
                  value={formData.unit}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Asking Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  required
                  placeholder="38"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Description</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe material dimensions, site origin, and pickup logistics..."
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500"
              ></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg flex items-center space-x-2"
              >
                <span>Next: Photos & Location</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Requirement 6: Photo Upload & Camera Capture Zone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                <span>Upload or Take Material Photos</span>
              </label>
              <p className="text-xs text-slate-400 mb-4">
                Please upload or capture real site photographs. URL text inputs have been removed.
              </p>

              {/* Hidden File Inputs */}
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={(e) => handlePhotoFiles(e.target.files)}
                className="hidden"
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={(e) => handlePhotoFiles(e.target.files)}
                className="hidden"
              />

              {/* Dropzone & Action Buttons */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 bg-slate-950/60 hover:border-emerald-500/80 rounded-xl p-6 text-center space-y-4 transition"
              >
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-950 transition"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Take Photo with Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Upload className="h-5 w-5 text-emerald-400" />
                    <span>Upload Local Photos</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Or drag and drop photo files here (JPEG, PNG, WEBP). Images will be automatically compressed for fast loading.
                </p>
              </div>

              {/* Photos Gallery Preview */}
              {formData.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">Attached Site Photographs ({formData.images.length})</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {formData.images.map((imgSrc, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 h-32 bg-slate-950 shadow-md">
                        <img src={imgSrc} alt={`Material ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            Main Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-red-950/90 hover:bg-red-900 text-red-200 rounded-full p-1 border border-red-800 shadow"
                          title="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Requirement 4: Site Location & Address Autofill */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Site Pickup Address</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    name="location_text"
                    placeholder="Enter site address (e.g. Whitefield, Bangalore)"
                    value={formData.location_text}
                    onChange={handleChange}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddressAutofill}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2.5 rounded-md text-xs font-semibold flex items-center space-x-1 shrink-0"
                  >
                    <Search className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Autofill Address</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-md font-medium"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Use My GPS Location</span>
                </button>
                {geocodingMsg && <span className="text-xs text-emerald-400 font-medium">{geocodingMsg}</span>}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Click anywhere on the interactive map to pin the exact site pickup point.</p>
                <MapView
                  listings={[]}
                  userLocation={{ latitude: Number(formData.latitude), longitude: Number(formData.longitude) }}
                  onLocationSelect={selectMapLocation}
                  height="18rem"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg flex items-center space-x-2"
              >
                <span>Next: Preview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white">{formData.title}</h3>
                  <p className="text-emerald-400 font-black text-xl mt-1">₹{formData.price} / {formData.unit}</p>
                </div>
                <span className="text-xs bg-slate-800 text-emerald-400 border border-slate-700 font-bold px-3 py-1 rounded-full">
                  {formData.condition}
                </span>
              </div>

              <p className="text-slate-300 text-sm">{formData.quantity} {formData.unit} available • Negotiable: {formData.is_negotiable ? 'Yes' : 'No'}</p>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{formData.description}</p>
              <p className="text-slate-400 text-xs pt-3 border-t border-slate-900">
                Site Address: <strong className="text-slate-200">{formData.location_text}</strong>
              </p>

              {formData.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2">
                  {formData.images.map((imgSrc, idx) => (
                    <img key={idx} src={imgSrc} alt="Preview" className="h-20 w-20 object-cover rounded border border-slate-800 shrink-0" />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold px-8 py-3 rounded-lg flex items-center space-x-2 shadow-lg shadow-emerald-950"
              >
                {loading ? 'Publishing Material...' : 'Publish Listing'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
