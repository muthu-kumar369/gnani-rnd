// react/src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { login } from '../../api/authService';
import { oauthService } from '../../api/oauthService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext';
import LoginLoader from '../ui/LoginLoader';
import { Lock, Mail, ArrowRight, Loader2, LogIn } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Authenticating...');
  const { loginStart, loginFailure, setAuth, refreshUser, error } = useUserStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLoadingMessage('Authenticating...');
    loginStart();

    try {
      const response = await login(email, password);

      setLoadingMessage('Loading profile...');
      setAuth(true, response.accessToken);
      await refreshUser();

      setLoadingMessage('Preparing workspace...');

      errorLogger.info('Login successful:', { context: 'LoginForm', extra: response });
      addToast('Welcome back!', 'success');

      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      errorLogger.error('Login error:', err, { context: 'LoginForm' });
      const errorMessage = err.message || 'An unknown error occurred during login';
      addToast(errorMessage, 'error');
      loginFailure(errorMessage);
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    setLoadingMessage('Connecting to Google...');
    loginStart();

    try {
      const response = await oauthService.initiateOAuth('google');

      setLoadingMessage('Loading profile...');
      setAuth(true, response.accessToken);
      await refreshUser();

      setLoadingMessage('Preparing workspace...');
      errorLogger.info('Google Login successful:', { context: 'LoginForm', extra: response });
      addToast('Welcome back!', 'success');

      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      errorLogger.error('Google Login error:', err, { context: 'LoginForm' });
      const errorMessage = err.message || 'An unknown error occurred during Google login';
      addToast(errorMessage, 'error');
      loginFailure(errorMessage);
      setLocalLoading(false);
    }
  };

  if (localLoading) {
    return <LoginLoader message={loadingMessage} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas-app text-type-primary p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background elements - Restored & Tuned */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gnani-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gnani-secondary/10 blur-[120px]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-white/10 dark:border-white/10 light:border-black/5 bg-canvas-surface/70 backdrop-blur-xl shadow-2xl transition-all duration-300"
      >
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#0077CC] to-[#0099FF] dark:from-gnani-primary dark:to-gnani-secondary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-gnani-primary/20">
            <LogIn className="text-white w-7 h-7" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-type-primary mb-2">Welcome Back</h2>
          <p className="text-type-secondary text-sm">Sign in to continue your journey with Gnani</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-status-error text-sm animate-shake">
            <div className="w-1 h-full bg-status-error rounded-full" />
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-gnani-primary/80 mb-1.5 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
            <input
              type="email"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={localLoading}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-type-secondary ml-1">Password</label>
            <Link to="/forgot-password" className="text-xs text-gnani-primary hover:text-gnani-primary-hover font-medium transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
            <input
              type="password"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={localLoading}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 relative overflow-hidden rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-gnani-primary focus:ring-offset-2 focus:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gnani-primary/20 flex items-center justify-center gap-2 auth-button"
          disabled={localLoading}
        >
          {localLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="tracking-wide font-bold">Sign In</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>


        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
          <span className="text-xs uppercase text-type-muted font-bold tracking-wider whitespace-nowrap">Or continue with</span>
          <div className="h-px bg-gray-200 dark:bg-white/10 flex-1" />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border-input)] rounded-xl hover:bg-[var(--bg-input)] hover:border-gnani-primary/30 transition-all duration-200 group bg-card"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm font-semibold text-type-primary group-hover:text-type-primary transition-colors">Google</span>
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-type-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-gnani-primary hover:text-gnani-primary-hover font-bold hover:underline transition-colors">
            Register now
          </Link>
        </p>
      </form >
    </div >
  );
};

export default LoginForm;