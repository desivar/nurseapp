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
    console.log("AuthContext: Initiating logout..."); // ADD THIS
    try {
      // await api.post('/auth/logout'); // Keep this commented for now if not implemented on backend
      console.log("AuthContext: Logout API call (if enabled) finished."); // ADD THIS
    } catch (err) {
      console.error('AuthContext: Error during logout attempt:', err); // ADD THIS
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
      console.log("AuthContext: Cleared local storage and state. Navigating to /"); // ADD THIS
      navigate('/');
    }
  }, [setToken, setUser, setError, navigate]);

  // Verify token on initial load
  useEffect(() => {
    console.log("AuthContext useEffect (verifyToken): Running. Current token:", token); // ADD THIS
    const verifyToken = async () => {
      try {
        if (token) {
          console.log("AuthContext: Token exists, attempting /auth/verify..."); // ADD THIS
          const { data } = await api.get('/auth/verify'); // api.js interceptor handles headers
          if (data.valid) {
            const decoded = jwtDecode(token);
            setUser(decoded);
            console.log("AuthContext: Token verified, user set:", decoded); // ADD THIS
          } else {
            console.log("AuthContext: Token verification failed (data.valid is false). Logging out."); // ADD THIS
            await logout();
          }
        } else {
          console.log("AuthContext: No token found on initial load or after logout. Setting user to null."); // ADD THIS
          setUser(null); // Ensure user is null if no token
        }
      } catch (err) {
        console.error('AuthContext: Token verification failed in useEffect catch:', err); // ADD THIS
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError('Session expired. Please log in again.');
          console.log("AuthContext: 401/403 error caught in useEffect. Logging out."); // ADD THIS
        } else {
          setError('Could not verify session. Please try again.');
          console.log("AuthContext: Other error caught in useEffect. Logging out."); // ADD THIS
        }
        await logout();
      } finally {
        setLoading(false);
        console.log("AuthContext: verifyToken function finished. Loading set to false."); // ADD THIS
      }
    };

    // Delay verification slightly if token just came from handleCallback.
    // This is a common pattern to avoid race conditions.
    // We only want to run this initial verification if the token isn't actively being processed
    // by handleCallback, or if it's already in localStorage on a page load/refresh.
    // Let's rely on the token state itself.
    verifyToken(); // Keep this simple for now, the AuthCallback awaits handleCallback.
                   // The crucial part is what happens on page refresh/direct access.

  }, [token, logout, setError, setLoading, setUser]); // Dependencies are correct

  // Axios Response Interceptor for global error handling (401/403)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('AuthContext Interceptor: Authentication error (401/403) detected. Logging out...'); // ADD THIS
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setError('Session expired. Please log in again.');
          navigate('/');
          return Promise.reject(new Error('Authentication failed. Redirected to login.'));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout, navigate, setToken, setUser, setError]);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!process.env.REACT_APP_API_BASE_URL) {
        throw new Error('API base URL is not configured in environment variables');
      }
      const authUrl = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
      console.log('AuthContext: Attempting redirect to GitHub:', authUrl); // ADD THIS
      window.location.href = authUrl;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to initiate login');
      console.error('AuthContext: Login initiation error:', err); // ADD THIS
    }
  };

  const handleCallback = useCallback(async (tokenParam) => {
    console.log("AuthContext: handleCallback received token. Processing..."); // ADD THIS
    try {
      localStorage.setItem('token', tokenParam);
      console.log("AuthContext: Token set in localStorage."); // ADD THIS
      setToken(tokenParam); // Update state to trigger useEffect and subsequent renders
      const decoded = jwtDecode(tokenParam);
      setUser(decoded);
      console.log("AuthContext: Token decoded, user set from callback:", decoded); // ADD THIS
      navigate('/dashboard'); // This navigate is now redundant if AuthCallback component handles it
      console.log("AuthContext: Navigated to dashboard from handleCallback (if not handled by AuthCallback component)."); // ADD THIS
      return decoded;
    } catch (err) {
      console.error('AuthContext: Error during handleCallback processing:', err); // ADD THIS
      setError('Failed to process authentication callback.');
      await logout();
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