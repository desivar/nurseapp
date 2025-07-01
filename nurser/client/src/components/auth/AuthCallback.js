import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Fixed import path

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      login({ token }).then(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return <div>Processing authentication...</div>;
};

export default AuthCallback;