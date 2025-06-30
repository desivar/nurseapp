import React from 'react'; // Import React for consistency, though not strictly necessary for this component
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, logout } = useAuth(); // Destructure 'logout' as well

  if (loading) {
    // Show a loading spinner or message while authentication is in progress
    return <div>Loading authentication...</div>;
  }

  // If loading is false, but there's no user (meaning token was invalid/expired or missing)
  if (!user) {
    // Automatically perform a client-side logout to clear any lingering invalid token
    // This part should be safe as logout is memoized with useCallback
    // and setError is handled by AuthContext
    logout(); // Call logout to ensure localStorage is clean and user is null

    // Redirect to the home page or login page
    return <Navigate to="/" replace />; // Consider redirecting to /login for clarity
  }

  // If loading is false and there's a user, render the children (the protected page)
  return children;
};

export default PrivateRoute;