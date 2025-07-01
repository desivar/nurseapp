import axios from './api'; // Your existing axios instance

export const loginWithGitHub = () => {
  window.location.href = 'http://localhost:5500/api/auth/github';
};

export const handleGitHubCallback = async (token) => {
  try {
    const response = await axios.get('/auth/me', {
      headers: { 'x-auth-token': token }
    });
    return response.data; // { id, email, role }
  } catch (err) {
    console.error('Auth failed:', err);
    throw err;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};