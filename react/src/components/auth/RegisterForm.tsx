// react/src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/authService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { setAuthState, loading, error } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState({ loading: true, error: null });

    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match';
      setAuthState({ loading: false, error: errorMessage });
      addToast(errorMessage, 'error');
      return;
    }

    try {
      await register(username, email, password);
      setAuthState({
        loading: false,
        error: null,
      });
      errorLogger.info('Registration successful!', { context: 'RegisterForm' });
      addToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      errorLogger.error('Registration error:', err, { context: 'RegisterForm' });
      const errorMessage = err.message || 'An unknown error occurred during registration';
      addToast(errorMessage, 'error');
      setAuthState({
        loading: false,
        error: errorMessage,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-jarvis-bg text-jarvis-blue">
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-jarvis-glow w-96 bg-black/50 backdrop-blur-md border border-jarvis-blue/30">
        <h2 className="text-3xl font-bold mb-6 text-center text-cyan-400" style={{ textShadow: '0 0 10px rgba(6,182,212,0.5)' }}>Register</h2>

        {error && <p className="text-red-400 text-center mb-4 bg-red-900/20 p-2 rounded border border-red-500/30">{error}</p>}

        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-2 text-cyan-300">
            Username
          </label>
          <input
            type="text"
            id="username"
            className="w-full p-3 bg-black/40 border border-jarvis-blue/50 rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue text-cyan-100 placeholder-cyan-700"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Choose a username"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-cyan-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full p-3 bg-black/40 border border-jarvis-blue/50 rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue text-cyan-100 placeholder-cyan-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-2 text-cyan-300">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full p-3 bg-black/40 border border-jarvis-blue/50 rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue text-cyan-100 placeholder-cyan-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            placeholder="Create a password"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-cyan-300">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full p-3 bg-black/40 border border-jarvis-blue/50 rounded-md focus:outline-none focus:ring-2 focus:ring-jarvis-blue text-cyan-100 placeholder-cyan-700"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-jarvis-blue text-black py-3 rounded-md font-bold hover:bg-cyan-300 transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-center mt-6 text-sm text-cyan-500/70">
          Already have an account?{' '}
          <Link to="/login" className="text-jarvis-blue hover:text-cyan-300 hover:underline transition-colors">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;