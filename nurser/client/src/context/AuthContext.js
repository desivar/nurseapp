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
    try {
      // Redirect to backend GitHub OAuth endpoint
      window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
    } catch (err) {
      setLoading(false);
      setError('Failed to initiate login');
      throw err;
    }
  };

  const handleCallback = async (token) => {
    try {
      localStorage.setItem('token', token);
      setToken(token);
      const decoded = jwtDecode(token);
      setUser(decoded);
      return decoded; // Return user data for optional use
    } catch (err) {
      await logout();
      setError('Failed to process authentication');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  // Check if user has specific role (useful for nurse/admin permissions)
  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
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