import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Duties from './pages/Duties';
import Shifts from './pages/Shifts';
import Patients from './pages/Patients';
import Profile from './pages/Profile';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import AuthCallback from './components/auth/AuthCallback';
import LoadingSpinner from './components/common/LoadingSpinner'; // Add this component

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div style={{ display: 'flex' }}>
              <Navbar />
            
              <div style={{ flexGrow: 1, padding: '24px', marginTop: '64px' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/duties" element={<Duties />} />
                    <Route path="/shifts" element={<Shifts />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                </Routes>
              </div>
            </div>
          </AuthProvider>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;