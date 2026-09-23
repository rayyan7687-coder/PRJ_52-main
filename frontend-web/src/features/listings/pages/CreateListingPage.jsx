import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Image as ImageIcon, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { MapView } from '../../../components/Map/MapView';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    location_text: 'Whitefield, Bangalore',
    images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80']
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

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const selectMapLocation = ({ latitude, longitude }) => {
    setFormData((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id, 10),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        images: formData.images.filter(img => img.trim() !== '')
      };

      const res = await apiFetch('/listings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      navigate(`/listings/${res.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">List Demolition & Construction Material</h1>
        <p className="text-slate-400 mt-1">Connect directly with nearby buyers, contractors, and recyclers.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4 text-sm font-semibold">
        <span className={step >= 1 ? 'text-emerald-400' : 'text-slate-500'}>1. Details</span>
        <span className={step >= 2 ? 'text-emerald-400' : 'text-slate-500'}>2. Images & Location</span>
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
                placeholder="e.g. Recovered I-Beams (ISMB 300)"
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
                placeholder="Describe material origin, dimensions, and pick-up logistics..."
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
                <span>Next: Images & Location</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Photograph Image URLs</label>
              {formData.images.map((img, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={img}
                    onChange={(e) => handleImageChange(idx, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                + Add another image URL
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Site Location Text</label>
                <input
                  type="text"
                  name="location_text"
                  value={formData.location_text}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-3 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Click the map to select the public pickup location for this listing.</p>
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
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <h3 className="text-xl font-bold text-white">{formData.title}</h3>
              <p className="text-emerald-400 font-bold text-lg">₹{formData.price} / {formData.unit}</p>
              <p className="text-slate-400 text-sm">{formData.quantity} {formData.unit} available • Condition: {formData.condition}</p>
              <p className="text-slate-300 text-sm mt-2">{formData.description}</p>
              <p className="text-slate-500 text-xs mt-2">Location: {formData.location_text} ({formData.latitude}, {formData.longitude})</p>
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
                {loading ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
