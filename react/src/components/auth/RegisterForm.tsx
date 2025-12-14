// react/src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';
import { register } from '../../api/authService';
import errorLogger from '../../utils/errorLogger';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { loginStart, loginFailure, error } = useUserStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    loginStart();

    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match';
      loginFailure(errorMessage);
      addToast(errorMessage, 'error');
      setLocalLoading(false);
      return;
    }

    try {
      await register(firstName, lastName, email, password);
      // Register just creates account and redirects to login.

      // Reset store error/loading
      loginFailure('');

      errorLogger.info('Registration successful!', { context: 'RegisterForm' });
      addToast('Registration successful! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      errorLogger.error('Registration error:', err, { context: 'RegisterForm' });
      const errorMessage = err.message || 'An unknown error occurred during registration';
      addToast(errorMessage, 'error');
      loginFailure(errorMessage);
      setLocalLoading(false);
    }
  };

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
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-type-primary mb-2">Create Account</h2>
          <p className="text-type-secondary text-sm">Join Gnani to experience the future of AI</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-status-error/10 border border-status-error/20 flex items-center gap-2 text-status-error text-sm animate-shake">
            <div className="w-1 h-full bg-status-error rounded-full" />
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block text-xs font-semibold text-type-secondary mb-1.5 ml-1">First Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={localLoading}
                required
              />
            </div>
          </div>
          <div className="w-1/2">
            <label className="block text-xs font-semibold text-type-secondary mb-1.5 ml-1">Last Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={localLoading}
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-type-secondary mb-1.5 ml-1">Email Address</label>
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

        <div className="mb-4">
          <label className="block text-xs font-semibold text-type-secondary mb-1.5 ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
            <input
              type="password"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={localLoading}
              required
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-semibold text-type-secondary mb-1.5 ml-1">Confirm Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-type-muted group-focus-within:text-gnani-primary transition-colors z-10" />
            <input
              type="password"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl py-3 pl-10 pr-4 text-sm text-type-primary placeholder-[var(--text-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-gnani-primary/50 focus:border-gnani-primary transition-all shadow-sm"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span className="tracking-wide font-bold">Create Account</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="text-center mt-6 text-sm text-type-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-gnani-primary hover:text-gnani-primary-hover font-bold hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;