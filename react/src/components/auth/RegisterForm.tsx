// react/src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/authService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext'; // Import useToast

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { setAuthState, loading, error } = useAuth();
  const { addToast } = useToast(); // Use the addToast hook
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState({ loading: true, error: null });

    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match';
      setAuthState({ loading: false, error: errorMessage });
      addToast(errorMessage, 'error'); // Show error toast
      return;
    }

    try {
      await register(username, email, password);
      setAuthState({
        loading: false,
        error: null,
      });
      errorLogger.info('Registration successful!', { context: 'RegisterForm' });
      addToast('Registration successful! Please log in.', 'success'); // Show success toast
      navigate('/login');
    } catch (err: any) {
      errorLogger.error('Registration error:', err, { context: 'RegisterForm' });
      const errorMessage = err.message || 'An unknown error occurred during registration';
      addToast(errorMessage, 'error'); // Show error toast
      setAuthState({
        loading: false,
        error: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-jarvis-bg text-jarvis-blue">
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-jarvis-glow w-96">
        <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="w-full p-3 bg-gray-700 border border-jarvis-blue rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full p-3 bg-gray-700 border border-jarvis-blue rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="mb-4">
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

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full p-3 bg-gray-700 border border-jarvis-blue rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-jarvis-blue text-jarvis-bg py-3 rounded-md font-semibold hover:bg-opacity-80 transition-all duration-200"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center mt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-jarvis-blue hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;