import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Replace with your actual GitHub auth flow
      const response = await axios.get('/api/auth/github');
      await login(response.data.token);
    } catch (err) {
      setError('Login failed');
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit}>Sign in with GitHub</button>
      {error && <p>{error}</p>}
    </div>
  );
};