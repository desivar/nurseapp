import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify token on initial load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (token) {
          const { data } = await api.get('/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (data.valid) {
            const decoded = jwtDecode(token);
            setUser(decoded);
          } else {
            await logout();
          }
        }
      } catch (err) {
        await logout();
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async () => {
    setLoading(true);
    setError(null);
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
  };

  const handleCallback = async (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    handleGitHubCallback: handleCallback
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);