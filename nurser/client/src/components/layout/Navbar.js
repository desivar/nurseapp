import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, loading } = useAuth(); // Add loading state
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optional: Show error notification
    }
  };

  if (loading) {
    return (
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Nurse Duty Manager
          </Typography>
          <CircularProgress color="inherit" size={24} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/"
          sx={{ 
            flexGrow: 1,
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': {
              cursor: 'pointer'
            }
          }}
        >
          Nurse Duty Manager
        </Typography>
        
        {user ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/duties">
              Duties
            </Button>
            <Button color="inherit" component={Link} to="/shifts">
              Shifts
            </Button>
            <Button color="inherit" component={Link} to="/profile">
              Profile
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;