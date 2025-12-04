// /react/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import GnaniCore from './components/gnani/GnaniCore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useUserStore } from './store/useUserStore';
import { ToastProvider } from './context/ToastContext';
import LoadingScreen from './components/common/LoadingScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Protected Route Wrapper - only renders when authenticated
function ProtectedRoute() {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary componentName="GnaniCore">
      <GnaniCore />
    </ErrorBoundary>
  );
}

function App() {
  const { isAuthenticated, loading } = useUserStore();

  // Show loading screen only while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-jarvis-bg min-h-screen w-full overflow-hidden text-jarvis-text font-sans selection:bg-jarvis-blue selection:text-jarvis-bg">
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Route */}
          <Route path="/" element={<ProtectedRoute />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </ToastProvider>
    </div>
  );
}

export default App;