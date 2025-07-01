import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Box
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Assignment as DutiesIcon,
  Schedule as ShiftsIcon,
  People as PatientsIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Active route styling
  const activeRoute = (route) => {
    return location.pathname === route;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box 
      sx={{ 
        width: 250,
        height: '100vh',
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <List>
          <ListItem 
            button 
            component={Link} 
            to="/dashboard"
            selected={activeRoute('/dashboard')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }
            }}
          >
            <ListItemIcon>
              <DashboardIcon color={activeRoute('/dashboard') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{
                fontWeight: activeRoute('/dashboard') ? 'medium' : 'normal'
              }}
            />
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to="/duties"
            selected={activeRoute('/duties')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <ListItemIcon>
              <DutiesIcon color={activeRoute('/duties') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Duties" 
              primaryTypographyProps={{
                fontWeight: activeRoute('/duties') ? 'medium' : 'normal'
              }}
            />
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to="/shifts"
            selected={activeRoute('/shifts')}
          >
            <ListItemIcon>
              <ShiftsIcon color={activeRoute('/shifts') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Shifts" 
              primaryTypographyProps={{
                fontWeight: activeRoute('/shifts') ? 'medium' : 'normal'
              }}
            />
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to="/patients"
            selected={activeRoute('/patients')}
          >
            <ListItemIcon>
              <PatientsIcon color={activeRoute('/patients') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Patients" 
              primaryTypographyProps={{
                fontWeight: activeRoute('/patients') ? 'medium' : 'normal'
              }}
            />
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to="/profile"
            selected={activeRoute('/profile')}
          >
            <ListItemIcon>
              <ProfileIcon color={activeRoute('/profile') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Profile" 
              primaryTypographyProps={{
                fontWeight: activeRoute('/profile') ? 'medium' : 'normal'
              }}
            />
          </ListItem>
        </List>
      </Box>

      {user && (
        <>
          <Divider />
          <List>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText'
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );
};

export default Sidebar;