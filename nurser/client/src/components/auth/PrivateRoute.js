import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;