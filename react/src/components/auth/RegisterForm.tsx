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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm">Join Gnani to experience the future of AI</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm animate-shake">
            <div className="w-1 h-full bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">First Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={localLoading}
                required
              />
            </div>
          </div>
          <div className="w-1/2">
            <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">Last Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
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
          <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="email"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={localLoading}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="password"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={localLoading}
              required
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-medium text-cyan-300/80 mb-1.5 ml-1">Confirm Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="password"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
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
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={localLoading}
        >
          <div className="relative h-full bg-black/40 hover:bg-transparent transition-colors rounded-[11px] px-4 py-3 flex items-center justify-center gap-2">
            {localLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <span className="font-semibold text-white tracking-wide">Create Account</span>
                <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;