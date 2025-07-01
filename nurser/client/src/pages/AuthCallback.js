import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');

    if (token) {
      login(token, { role }); // Update auth context
      navigate(role === 'admin' ? '/dashboard' : '/shifts');
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [location]);

  return <div>Loading...</div>;
}