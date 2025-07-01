import { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PrivateRoute = () => {
  const { user, loading, verifyToken } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user && !loading) {
      verifyToken();
    }
  }, [user, loading, verifyToken]);

  if (loading) return <LoadingSpinner fullScreen />;

  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;