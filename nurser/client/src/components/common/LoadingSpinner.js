import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = ({ fullScreen = false }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight={fullScreen ? '100vh' : 'auto'}
    width={fullScreen ? '100vw' : 'auto'}
    position={fullScreen ? 'fixed' : 'static'}
    top={0}
    left={0}
    zIndex={fullScreen ? 9999 : 'auto'}
    bgcolor={fullScreen ? 'rgba(0,0,0,0.5)' : 'transparent'}
  >
    <CircularProgress />
  </Box>
);

export default LoadingSpinner;