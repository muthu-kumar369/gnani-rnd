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
const ChatLayout = React.lazy(() => import('./layouts/ChatLayout'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

// Protected Route Wrapper - only renders when authenticated
function ProtectedRoute() {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate to="/chat" replace />
  );
}

// Middleware to require authentication for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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

            {/* Root Route - Redirects based on auth */}
            <Route path="/" element={<ProtectedRoute />} />

            {/* Protected Routes */}
            <Route path="/chat" element={
              <RequireAuth>
                <ErrorBoundary>
                  <ChatLayout />
                </ErrorBoundary>
              </RequireAuth>
            }>
              <Route index element={<ChatPage />} />
            </Route>

            <Route path="/settings" element={
              <RequireAuth>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </RequireAuth>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </div>
  );
}

export default App;