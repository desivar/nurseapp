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
  // DialogActions removed since it's unused
  Add,
  Edit,
  Delete
} from '@mui/material';
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

  // Fetch duties
  const { data: duties, isLoading, error } = useQuery({
    queryKey: ['duties'],
    queryFn: getDuties
  });

  // Delete duty mutation
  const deleteMutation = useMutation({
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
      deleteMutation.mutate(id);
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
  if (error) return <Alert severity="error">Error loading duties: {error.message}</Alert>;

  return (
    <Box>
      {/* DutyForm dialog/component */}
      <DutyForm
        open={openForm}
        duty={selectedDuty}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
      />
      {/* Duties Table */}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duties && duties.map((duty) => (
              <TableRow key={duty.id}>
                <TableCell>{duty.name}</TableCell>
                <TableCell>{duty.description}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEdit(duty)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(duty.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Duties;