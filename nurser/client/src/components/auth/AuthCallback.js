import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleGitHubCallback } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleGitHubCallback(token);
    }
  }, [searchParams, handleGitHubCallback]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress />
    </Box>
  );
};

export default AuthCallback;