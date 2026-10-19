const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
const API_BASE = (import.meta.env.DEV && !import.meta.env.VITE_API_URL ? '' : rawApiUrl) + '/api/v1';

export const getWebSocketUrl = (conversationId, token) => {
  let wsBase = API_BASE.replace(/^http/, 'ws');
  if (!wsBase.startsWith('ws://') && !wsBase.startsWith('wss://')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsBase = `${protocol}//${window.location.host}${API_BASE}`;
  }
  return `${wsBase}/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          localStorage.setItem('token', refreshData.access_token);
          headers['Authorization'] = `Bearer ${refreshData.access_token}`;
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...fetchOptions,
            headers,
          });
        }
      }
    } catch {
      // Refresh failed
    }

    if (!response.ok && response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};
