import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      // await api.post('/auth/logout'); // Keep this commented for now if not implemented on backend
      console.log("Logging out...");
    } catch (err) {
      console.error('Error during logout attempt (e.g., network issue to /auth/logout):', err);
      // Even if there's an error calling the logout API, we still want to clear client-side state
    } finally { // This finally is correctly placed for the async operation in try, or just for cleanup
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
      navigate('/'); // Redirect to home/login after logout
    }
  }, [setToken, setUser, setError, navigate]);

  // Verify token on initial load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (token) {
          const { data } = await api.get('/auth/verify'); // api.js interceptor handles headers
          if (data.valid) {
            const decoded = jwtDecode(token);
            setUser(decoded);
          } else {
            await logout();
          }
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        // Specifically check for Axios errors for 401/403.
        // The interceptor below also handles this, but a direct catch here is good for initial load.
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
             setError('Session expired. Please log in again.');
        } else {
             setError('Could not verify session. Please try again.');
        }
        await logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, logout, setError, setLoading, setUser]);

  // Axios Response Interceptor for global error handling (401/403)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('Authentication error (401/403) detected by interceptor. Logging out...');
          // Make sure logout clears the token BEFORE navigate, to prevent loop
          localStorage.removeItem('token'); // Ensure token is gone immediately
          setToken(null);
          setUser(null);
          setError('Session expired. Please log in again.');
          navigate('/'); // Redirect to home/login
          // Prevent further propagation of this specific error to react-query or calling components
          return Promise.reject(new Error('Authentication failed. Redirected to login.'));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout, navigate, setToken, setUser, setError]); // Add all state setters to dependencies

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
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

  const handleCallback = useCallback(async (tokenParam) => { // Renamed 'token' to 'tokenParam' to avoid conflict
    try {
      localStorage.setItem('token', tokenParam);
      setToken(tokenParam);
      const decoded = jwtDecode(tokenParam);
      setUser(decoded);
      navigate('/dashboard');
      return decoded;
    } catch (err) {
      console.error('Error during handleCallback:', err);
      setError('Failed to process authentication callback.');
      await logout(); // Ensure logout if callback fails
      throw err;
    }
  }, [setToken, setUser, logout, setError, navigate]);

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
      {children}
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