import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Assignment as DutiesIcon,
  Schedule as ShiftsIcon,
  People as PatientsIcon,
  Person as ProfileIcon
} from '@mui/icons-material';

const Sidebar = () => {
  return (
    <div style={{ width: 250 }}>
      <List>
        <ListItem button component={Link} to="/dashboard">
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/duties">
          <ListItemIcon><DutiesIcon /></ListItemIcon>
          <ListItemText primary="Duties" />
        </ListItem>
        <ListItem button component={Link} to="/shifts">
          <ListItemIcon><ShiftsIcon /></ListItemIcon>
          <ListItemText primary="Shifts" />
        </ListItem>
        <ListItem button component={Link} to="/patients">
          <ListItemIcon><PatientsIcon /></ListItemIcon>
          <ListItemText primary="Patients" />
        </ListItem>
        <ListItem button component={Link} to="/profile">
          <ListItemIcon><ProfileIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
    </div>
  );
};

export default Sidebar;