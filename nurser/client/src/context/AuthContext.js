import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

// 1. Create Context
const AuthContext = createContext();

// 2. Create Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
            logout();
          }
        }
      } catch (err) {
        logout();
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login function
  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
    } catch (err) {
      setError('Failed to initiate login');
      setLoading(false);
      throw err;
    }
  };

  // Handle OAuth callback
  const handleCallback = async (token) => {
    try {
      localStorage.setItem('token', token);
      setToken(token);
      const decoded = jwtDecode(token);
      setUser(decoded);
      navigate('/dashboard');
    } catch (err) {
      setError('Authentication failed');
      logout();
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  };

  // Provider value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    handleGitHubCallback: handleCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};