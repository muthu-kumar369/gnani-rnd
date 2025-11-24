// react/src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/authService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext'; // Import useToast

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuthState, loading, error } = useAuth();
  const { addToast } = useToast(); // Use the addToast hook
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState({ loading: true, error: null });

    try {
      const response = await login(email, password);
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        loading: false,
      });
      errorLogger.info('Login successful:', { context: 'LoginForm', extra: response });
      addToast('Login successful!', 'success'); // Show success toast
      navigate('/');
    } catch (err: any) {
      errorLogger.error('Login error:', err, { context: 'LoginForm' });
      const errorMessage = err.message || 'An unknown error occurred during login';
      addToast(errorMessage, 'error'); // Show error toast
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-jarvis-bg text-jarvis-blue">
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-jarvis-glow w-96">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email" // Changed type to email
            id="email"
            className="w-full p-3 bg-gray-700 border border-jarvis-blue rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full p-3 bg-gray-700 border border-jarvis-blue rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-jarvis-blue text-jarvis-bg py-3 rounded-md font-semibold hover:bg-opacity-80 transition-all duration-200"
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Login'}
        </button>

        <p className="text-center mt-4 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-jarvis-blue hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;