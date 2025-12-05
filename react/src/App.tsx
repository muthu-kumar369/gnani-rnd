import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import { ToastProvider } from './context/ToastContext';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components
const GnaniCore = React.lazy(() => import('./components/gnani/GnaniCore'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));

// Protected Route Wrapper - only renders when authenticated
function ProtectedRoute() {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <GnaniCore />
    </ErrorBoundary>
  );
}

function App() {
  const { isAuthenticated, isInitialized } = useUserStore();

  // Show loading screen only while checking authentication
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-jarvis-bg min-h-screen w-full overflow-hidden text-jarvis-text font-sans selection:bg-jarvis-blue selection:text-jarvis-bg">
      <ToastProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Route */}
            <Route path="/" element={<ProtectedRoute />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </div>
  );
}

export default App;