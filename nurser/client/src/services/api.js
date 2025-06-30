import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Corrected header: Use 'Authorization' with 'Bearer ' prefix
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// IMPORTANT: Global response error handling (e.g., for 401/403)
// This part needs to be configured where AuthContext (and thus 'logout') is available.
// We will do this in the next step, likely in App.js or a dedicated provider component.
// For now, we will leave this part out of api.js directly to avoid the 'useAuth' error.

export default api;