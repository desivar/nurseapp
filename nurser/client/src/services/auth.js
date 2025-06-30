import api from './api';

export const loginWithGitHub = async () => {
  // This will redirect to the backend GitHub OAuth endpoint
  window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/github`;
};

export const logout = async () => {
  try {
    // This will now correctly use the Authorization: Bearer token from api.js interceptor
    // and will be caught by the new AuthContext.js response interceptor if the token is expired.
    await api.get('/auth/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const verifyToken = async (token) => {
  try {
    // The api.js interceptor will automatically add the Authorization: Bearer token
    // so no need to specify headers here manually.
    const response = await api.get('/auth/verify'); // Removed the headers option
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};