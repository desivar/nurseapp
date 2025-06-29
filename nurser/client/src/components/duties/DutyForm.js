import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const DutyForm = ({ duty, onSuccess, onCancel }) => {
  return (
    <Dialog open={true} onClose={onCancel}>
      <DialogTitle>{duty ? 'Edit Duty' : 'Add New Duty'}</DialogTitle>
      <DialogContent>
        {/* Add your form fields here */}
        <div>Duty Form Content</div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSuccess} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DutyForm;