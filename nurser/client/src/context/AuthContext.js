
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize logout function to be used as a dependency in useCallback
  // and in useEffect without causing re-render loops.
  // This is a common pattern when a function defined within the component
  // needs to be stable across renders.
  const logout = useCallback(async () => {
    try {
      // Temporarily commented out to avoid 404 during current debugging
      // await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error (ignored for now):', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, [setToken, setUser, setError]); // Dependencies for logout

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
  }, [token, logout, setError, setLoading, setUser]); // Add dependencies for verifyToken

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // Verify environment variable exists
      if (!process.env.REACT_APP_API_BASE_URL) {
        throw new Error('API base URL is not configured in environment variables');
      }
      
      const authUrl = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
      console.log('Attempting redirect to:', authUrl);
      
      window.location.href = authUrl;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to initiate login');
      console.error('Login error:', err);
    }
  };

  const handleCallback = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      setToken(token);
      const decoded = jwtDecode(token);
      setUser(decoded);
      return decoded;
    } catch (err) {
      await logout();
      setError('Failed to process authentication');
      throw err;
    }
  }, [setToken, setUser, logout, setError]); // Dependencies for handleCallback

  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout, // Ensure this refers to the useCallback-wrapped logout
    handleCallback,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};