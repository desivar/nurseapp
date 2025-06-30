
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import api from '../services/api'; // Import your configured Axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate hook

  const logout = useCallback(async () => {
    try {
      // await api.post('/auth/logout'); // Keep this commented for now
    } catch (err) {
      console.error('Logout error (ignored for now):', err);
    .finally(() => { // Use .finally directly on the try/catch block if not awaiting an async call
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
      navigate('/'); // Redirect to home/login after logout
    });
    }
  }, [setToken, setUser, setError, navigate]); // Add navigate to dependencies

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
            // Token is not valid, force logout
            await logout();
          }
        }
      } catch (err) {
        // If /auth/verify fails (e.g., network error, server error), force logout
        console.error('Token verification failed:', err);
        await logout();
        setError('Session expired or verification failed. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, logout, setError, setLoading, setUser]);

  // Axios Response Interceptor for global error handling (401/403)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response, // Just return the response if no error
      async (error) => {
        // Check if the error is a 401 Unauthorized or 403 Forbidden response
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('Authentication error (401/403) detected. Logging out...');
          await logout(); // Trigger logout to clear state and redirect
          // Prevent further propagation of this specific error
          return Promise.reject(new Error('Authentication failed. Redirected to login.'));
        }
        // For any other error, propagate it
        return Promise.reject(error);
      }
    );

    // Cleanup function: remove the interceptor when the component unmounts
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout]); // Depend on logout, so interceptor is re-setup if logout changes

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

  const handleCallback = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      setToken(token);
      const decoded = jwtDecode(token);
      setUser(decoded);
      navigate('/dashboard'); // Redirect to dashboard after successful callback
      return decoded;
    } catch (err) {
      await logout();
      setError('Failed to process authentication');
      throw err;
    }
  }, [setToken, setUser, logout, setError, navigate]); // Add navigate to dependencies

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
      {/* Removed !loading condition here because PrivateRoute handles loading state now */}
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