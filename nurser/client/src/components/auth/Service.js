import api from './api';

export const loginWithGitHub = async () => {
  // Redirect to backend GitHub OAuth endpoint
  window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
};

export const logout = async () => {
  try {
    await api.get('/auth/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await api.get('/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.valid;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};