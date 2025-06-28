import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { loginWithGitHub, logout as apiLogout, verifyToken } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (token) {
          const isValid = await verifyToken(token);
          if (isValid) {
            const decoded = jwtDecode(token);
            setUser(decoded);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  const login = async () => {
    await loginWithGitHub();
  };

  const handleGitHubCallback = async (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    navigate('/dashboard');
  };

  const logout = async () => {
    await apiLogout();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading,
        login, 
        logout, 
        handleGitHubCallback 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);