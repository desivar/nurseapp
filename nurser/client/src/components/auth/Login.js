import { Button, Box, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="80vh"
      textAlign="center"
    >
      <Typography variant="h4" gutterBottom>
        Nurse Duty Manager
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Please sign in to access your dashboard
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<GitHubIcon />}
        onClick={login}
        size="large"
        sx={{ mt: 3 }}
      >
        Sign in with GitHub
      </Button>
    </Box>
  );
};

export default Login;