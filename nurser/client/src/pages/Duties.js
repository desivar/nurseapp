import { useState } from 'react';
import { 
  useQuery, 
  useQueryClient, 
  useMutation 
} from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getDuties, deleteDuty } from '../services/duties';
import DutyForm from '../components/duties/DutyForm';

const Duties = () => {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch duties data
  const { data: duties, isLoading, isError, error } = useQuery({
    queryKey: ['duties'],
    queryFn: getDuties
  });

  // Delete duty mutation
  const { mutate: deleteDutyMutation } = useMutation({
    mutationFn: deleteDuty,
    onSuccess: () => {
      queryClient.invalidateQueries(['duties']);
      setSnackbar({
        open: true,
        message: 'Duty deleted successfully',
        severity: 'success'
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete duty',
        severity: 'error'
      });
    }
  });

  const handleEdit = (duty) => {
    setSelectedDuty(duty);
    setOpenForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this duty?')) {
      deleteDutyMutation(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedDuty(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries(['duties']);
    setOpenForm(false);
    setSelectedDuty(null);
    setSnackbar({
      open: true,
      message: 'Duty saved successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error loading duties: {error.message}</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Nurse Duties</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Add Duty
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nurse</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duties?.map((duty) => (
              <TableRow key={duty._id}>
                <TableCell>{duty.nurse?.displayName || 'Unknown'}</TableCell>
                <TableCell>{duty.patient?.name || 'Unknown'}</TableCell>
                <TableCell>
                  {duty.shift?.name} ({new Date(duty.shift?.startTime).toLocaleTimeString()})
                </TableCell>
                <TableCell>{duty.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(duty)}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(duty._id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDuty ? 'Edit Duty' : 'Add New Duty'}</DialogTitle>
        <DialogContent>
          <DutyForm 
            duty={selectedDuty} 
            onSuccess={handleSuccess} 
            onCancel={handleCloseForm}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Duties;