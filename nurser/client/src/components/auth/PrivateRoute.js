import React from 'react'; // React is still used, no need for useEffect here
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth(); // We only need 'user' and 'loading' here

  // 1. Show loading state:
  if (loading) {
    // While AuthContext is determining if there's a valid user, show a loading message.
    return <div>Loading authentication...</div>; // Or a loading spinner component
  }

  // 2. If not loading AND no user:
  if (!user) {
    // This means the AuthContext has finished loading and determined there's no authenticated user.
    // The AuthContext's interceptor or initial verification logic would have already:
    // a) Cleared any invalid token from localStorage.
    // b) Set the 'user' state to null.
    // c) Called navigate('/') to redirect the user to the home/login page.
    // So, this `Maps` component here serves as an immediate visual redirect
    // in the render tree for this specific path. It's a fallback to ensure navigation
    // if for any reason the AuthContext's navigation took a moment longer to apply.
    return <Navigate to="/" replace />;
  }

  // 3. If not loading AND there is a user:
  // Render the children (the protected content for the authenticated user).
  return children;
};

export default PrivateRoute;