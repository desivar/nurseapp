import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { loginWithGitHub, logout as apiLogout, verifyToken } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
    error: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUserToken = async () => {
      try {
        if (authState.token) {
          const isValid = await verifyToken(authState.token);
          if (isValid) {
            const decoded = jwtDecode(authState.token);
            setAuthState(prev => ({
              ...prev,
              user: decoded,
              loading: false,
              error: null
            }));
          } else {
            clearAuth();
          }
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        clearAuth();
        setAuthState(prev => ({
          ...prev,
          error: 'Session verification failed',
          loading: false
        }));
      }
    };

    verifyUserToken();
  }, [authState.token]);

  const clearAuth = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null
    });
  };

  const login = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await loginWithGitHub();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Login failed',
        loading: false
      }));
    }
  };

  const handleGitHubCallback = async (token) => {
    try {
      localStorage.setItem('token', token);
      setAuthState(prev => ({
        ...prev,
        token,
        loading: false,
        error: null
      }));
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth callback failed:', error);
      clearAuth();
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await apiLogout();
      clearAuth();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Logout failed',
        loading: false
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        handleGitHubCallback
      }}
    >
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