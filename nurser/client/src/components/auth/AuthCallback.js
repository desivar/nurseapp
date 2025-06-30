import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback, user, loading } = useAuth(); // Also get 'user' and 'loading' from context
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const processAuth = async () => { // Make this an async function
      const token = searchParams.get('token');
      if (token) {
        try {
          // Await the handleCallback to ensure context state is updated
          await handleCallback(token);
          // If handleCallback succeeds, the user state should be updated.
          // Navigate only after successful processing.
          navigate('/dashboard', { replace: true }); // Use replace to avoid back button issues
        } catch (error) {
          console.error("Error processing auth callback in AuthCallback component:", error);
          // If there's an error in handleCallback, navigate to login
          navigate('/login', { replace: true });
        }
      } else {
        // No token in URL, might be an error or direct access to callback URL
        console.warn("No token found in callback URL. Redirecting to login.");
        navigate('/login', { replace: true });
      }
    };

    // Only run if not already loading and no user (or if there's a token to process)
    // This prevents re-running if user is already authenticated or if component is just re-rendering
    if (!loading && !user && searchParams.get('token')) { // Only process if loading is false, no user, and token is present
        processAuth();
    } else if (user) { // If user is already set, perhaps from local storage
        navigate('/dashboard', { replace: true });
    }
  }, [searchParams, handleCallback, navigate, user, loading]); // Add user and loading to dependencies

  // Show loading spinner while processing or waiting for redirect
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress />
    </Box>
  );
};

export default AuthCallback;