import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Initial sync from localStorage
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    console.log("AuthContext: Initiating logout...");
    try {
      // await api.post('/auth/logout'); // Keep this commented for now if not implemented on backend
      console.log("AuthContext: Logout API call (if enabled) finished.");
    } catch (err) {
      console.error('AuthContext: Error during logout attempt:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
      console.log("AuthContext: Cleared local storage and state. Navigating to /");
      navigate('/', { replace: true }); // Use replace here as well
    }
  }, [setToken, setUser, setError, navigate]);

  // Handle token from URL callback explicitly
  const handleCallback = useCallback(async (tokenParam) => {
    console.log("AuthContext: handleCallback received token. Processing...");
    try {
      localStorage.setItem('token', tokenParam);
      console.log("AuthContext: Token set in localStorage.");
      setToken(tokenParam); // Update state here
      const decoded = jwtDecode(tokenParam);
      setUser(decoded);
      console.log("AuthContext: Token decoded, user set from callback:", decoded);
      // No navigation here, AuthCallback component will handle it.
      return decoded;
    } catch (err) {
      console.error('AuthContext: Error during handleCallback processing:', err);
      setError('Failed to process authentication callback.');
      await logout();
      throw err;
    }
  }, [setToken, setUser, logout, setError]); // Removed navigate from here, AuthCallback component handles it.

  // Verify token on initial load and whenever 'token' state changes
  useEffect(() => {
    console.log("AuthContext useEffect (verifyToken): Running. Current token value in effect:", token); // Log the captured token
    const verifyToken = async () => {
      // If there's no token, or it's just been set to null by logout, immediately finish loading
      if (!token) {
        console.log("AuthContext: No token found in useEffect. Setting user to null and loading to false.");
        setUser(null);
        setLoading(false);
        return; // Exit early
      }

      // If a token exists, proceed to verify it
      try {
        console.log("AuthContext: Token exists, attempting /auth/verify...");
        const { data } = await api.get('/auth/verify');
        if (data.valid) {
          const decoded = jwtDecode(token);
          setUser(decoded);
          console.log("AuthContext: Token verified, user set:", decoded);
        } else {
          console.log("AuthContext: Token verification failed (data.valid is false). Logging out.");
          await logout();
        }
      } catch (err) {
        console.error('AuthContext: Token verification failed in useEffect catch:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError('Session expired. Please log in again.');
          console.log("AuthContext: 401/403 error caught in useEffect. Logging out.");
        } else {
          setError('Could not verify session. Please try again.');
          console.log("AuthContext: Other error caught in useEffect. Logging out.");
        }
        await logout();
      } finally {
        setLoading(false);
        console.log("AuthContext: verifyToken function finished. Loading set to false.");
      }
    };

    // Call verifyToken. This useEffect will run whenever 'token' changes.
    // The `handleCallback` sets `token`, triggering this effect with the new token.
    verifyToken();

  }, [token, logout, setError, setLoading, setUser]); // Dependencies are correct: 'token' is key here.

  // Axios Response Interceptor for global error handling (401/403) - unchanged from last version
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('AuthContext Interceptor: Authentication error (401/403) detected. Logging out...');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setError('Session expired. Please log in again.');
          navigate('/', { replace: true }); // Use replace here
          return Promise.reject(new Error('Authentication failed. Redirected to login.'));
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout, navigate, setToken, setUser, setError]);

  const login = async () => { // Unchanged from last version
    setLoading(true);
    setError(null);
    try {
      if (!process.env.REACT_APP_API_BASE_URL) {
        throw new Error('API base URL is not configured in environment variables');
      }
      const authUrl = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
      console.log('AuthContext: Attempting redirect to GitHub:', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to initiate login');
      console.error('AuthContext: Login initiation error:', err);
    }
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    // logout, // Keep logout as is
    handleCallback,
    hasRole
  };

  // Provide logout directly from the context value, rather than through useAuth only.
  // This helps ensure it's stable and callable from other places.
  return (
    <AuthContext.Provider value={{ ...value, logout }}>
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