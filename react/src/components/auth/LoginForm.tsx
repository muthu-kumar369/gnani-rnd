// react/src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/authService';
import { oauthService } from '../../api/oauthService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuthState, loading, error } = useAuth();
  const { addToast } = useToast();
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
      addToast('Login successful!', 'success');
      navigate('/');
    } catch (err: any) {
      errorLogger.error('Login error:', err, { context: 'LoginForm' });
      const errorMessage = err.message || 'An unknown error occurred during login';
      addToast(errorMessage, 'error');
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
            type="email"
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

        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              setAuthState({ loading: true, error: null });
              try {
                const response = await oauthService.initiateOAuth('google');

                setAuthState({
                  isAuthenticated: true,
                  user: response.user,
                  accessToken: response.accessToken,
                  refreshToken: response.refreshToken,
                  loading: false,
                });

                errorLogger.info('Google Login successful:', { context: 'LoginForm', extra: response });
                addToast('Login successful!', 'success');
                navigate('/');
              } catch (err: any) {
                errorLogger.error('Google Login error:', err, { context: 'LoginForm' });
                const errorMessage = err.message || 'An unknown error occurred during Google login';
                addToast(errorMessage, 'error');
                setAuthState({
                  isAuthenticated: false,
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                  loading: false,
                  error: errorMessage,
                });
              }
            }}
            className="w-full bg-white text-gray-900 py-3 rounded-md font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Login with Google
          </button>
        </div>

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