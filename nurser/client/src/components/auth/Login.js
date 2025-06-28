import { useState } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Alert 
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, loading, error } = useAuth();
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLocalError(null);
    try {
      await login();
      // Optional: Add any post-login logic here
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h4" gutterBottom>
        Nurse Duty Manager
      </Typography>
      <Typography variant="subtitle1" gutterBottom mb={4}>
        Secure access to patient care management
      </Typography>

      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 3, maxWidth: 400 }}>
          {error || localError}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GitHubIcon />}
        onClick={handleLogin}
        size="large"
        sx={{ 
          mt: 2,
          px: 4,
          py: 1.5,
          fontSize: '1rem'
        }}
        disabled={loading}
      >
        {loading ? 'Authenticating...' : 'Continue with GitHub'}
      </Button>

      <Typography variant="body2" color="text.secondary" mt={4}>
        By continuing, you agree to our Healthcare Compliance Policies
      </Typography>
    </Box>
  );
};

export default Login;