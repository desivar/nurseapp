import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      <Typography variant="h2" gutterBottom>
        Welcome to Nurse Duty Manager
      </Typography>
      <Typography variant="h5" gutterBottom>
        {user ? `Hello, ${user.username}!` : 'Please sign in to continue'}
      </Typography>
      {user ? (
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 3 }}
        >
          Go to Dashboard
        </Button>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          sx={{ mt: 3 }}
        >
          Sign In
        </Button>
      )}
    </Box>
  );
};

export default Home;