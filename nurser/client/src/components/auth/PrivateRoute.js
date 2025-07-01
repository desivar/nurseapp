import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, verifyToken } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      verifyToken(); // Double-check auth state
    }
  }, [user, loading, verifyToken]);

  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;