// AuthContext.js
import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login'); // Explicit redirect on failure
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (token) => {
    localStorage.setItem('token', token);
    await verifyToken();
    navigate('/dashboard'); // Only redirect after successful verification
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};