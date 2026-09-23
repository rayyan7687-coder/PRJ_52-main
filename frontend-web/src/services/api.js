// Empty in local development so Vite's proxy is used. Set VITE_API_URL to the
// deployed backend URL (without a trailing slash) before building for production.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    if (response.status === 401 || (errorData.detail && errorData.detail.toLowerCase().includes('blocked'))) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    throw new Error(errorData.detail || `Error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};
