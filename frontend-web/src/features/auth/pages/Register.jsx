import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CONTRACTOR_BUILDER',
    address: 'Bangalore, India',
    admin_key: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions to register.');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        address: formData.address,
      };

      if (formData.role === 'ADMIN') {
        payload.admin_key = formData.admin_key;
      }

      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Create a BuildLoop Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-4 bg-red-950/80 border border-red-800 text-red-200 text-sm p-3 rounded">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">User Account Type</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              >
                <option value="CONTRACTOR_BUILDER">Contractor / Builder (Buy & Sell Leftover Materials)</option>
                <option value="RECYCLER">Recycler (Buy Recyclables Only)</option>
                <option value="ADMIN">Admin (Restricted Authorization)</option>
              </select>
            </div>

            {formData.role === 'ADMIN' && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded space-y-1">
                <label className="block text-xs font-semibold text-amber-300">Admin Secret Key</label>
                <input
                  type="password"
                  name="admin_key"
                  required
                  placeholder="Enter administrator authorization key"
                  value={formData.admin_key}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-slate-800 border border-amber-700/80 rounded-md py-2 px-3 text-white text-sm focus:ring-amber-500"
                />
                <p className="text-xs text-amber-400/80">Admin registration is restricted and requires authorization.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Address / Location</label>
              <input
                type="text"
                name="address"
                placeholder="e.g. Indiranagar, Bangalore"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-300">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-emerald-400 underline hover:text-emerald-300 font-medium">
                  Terms and Conditions
                </Link>
                {' '}(including the anti-fraud policy and instant account ban enforcement).
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Register Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
