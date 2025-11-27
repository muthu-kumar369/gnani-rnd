// /react/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GnaniCore from './components/gnani/GnaniCore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { GnaniStateProvider } from './context/GnaniStateContext';
import { ConversationProvider } from './context/ConversationContext';

// Simple Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-jarvis-bg">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jarvis-blue"></div>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-black">
      <ToastProvider>
        <UserProvider>
          <GnaniStateProvider>
            <ConversationProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/"
                  element={isAuthenticated ? <GnaniCore /> : <Navigate to="/login" replace />}
                />
                {/* Add other protected routes here */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ConversationProvider>
          </GnaniStateProvider>
        </UserProvider>
      </ToastProvider>
    </div>
  );
}

export default App;