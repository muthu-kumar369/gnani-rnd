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
    <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10 hover:border-cyan-500/20"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
            <LogIn className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to continue your journey with Gnani</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm animate-shake">
            <div className="w-1 h-full bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="email"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="block text-xs font-medium text-cyan-300/80">Password</label>
            <a href="#" className="text-xs text-cyan-400/80 hover:text-cyan-400 transition-colors">Forgot Password?</a>
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="password"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="relative h-full bg-black/40 hover:bg-transparent transition-colors rounded-[11px] px-4 py-3 flex items-center justify-center gap-2">
            <span className="font-semibold text-white tracking-wide">Sign In</span>
            <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0f0f11] px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white/5 border border-white/10 text-slate-300 py-2.5 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center justify-center gap-2.5 group"
        >
          <svg className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
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
          <span>Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors">
            Register now
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;