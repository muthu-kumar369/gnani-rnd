// /react/src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GnaniCore from './components/gnani/GnaniCore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { GnaniStateProvider } from './context/GnaniStateContext';
import { ConversationProvider } from './context/ConversationContext';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [minLoadComplete, setMinLoadComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadComplete(true);
    }, 2000); // Minimum 2 seconds loading screen
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minLoadComplete) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-jarvis-bg min-h-screen w-full overflow-hidden text-jarvis-text font-sans selection:bg-jarvis-blue selection:text-jarvis-bg">
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