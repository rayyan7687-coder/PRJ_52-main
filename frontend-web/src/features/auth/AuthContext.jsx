import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const me = await apiFetch('/auth/me');
          setUser(me);
        } catch (err) {
          console.error('Failed to load user session:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', res.access_token);
    const me = await apiFetch('/auth/me');
    setUser(me);
    return me;
  };

  const register = async (userData) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
