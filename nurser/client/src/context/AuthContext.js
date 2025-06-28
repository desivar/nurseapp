import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { loginWithGitHub, logout as apiLogout } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setUser(decoded);
      localStorage.setItem('token', token);
    } else {
      setUser(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async () => {
    try {
      // This will redirect to GitHub OAuth
      await loginWithGitHub();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGitHubCallback = async (token) => {
    setToken(token);
    navigate('/dashboard');
  };

  const logout = async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, handleGitHubCallback }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);