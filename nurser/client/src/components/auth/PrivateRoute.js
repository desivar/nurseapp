import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Correct path to useAuth

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Destructure 'loading' from useAuth()

  if (loading) {
    // Optionally: Render a loading spinner or message while authentication is in progress
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    // If loading is false and there's no user, redirect to home/login
    return <Navigate to="/" replace />; // You might want to redirect to /login instead of /
  }

  // If loading is false and there's a user, render the children (the protected page)
  return children;
};

export default PrivateRoute;