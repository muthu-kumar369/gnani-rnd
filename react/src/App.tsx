import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import { ToastProvider } from './context/ToastContext';
import LoadingScreen from './components/common/LoadingScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary'; // STAGE 15
import OfflineIndicator from './components/common/OfflineIndicator'; // STAGE 16
import ErrorDisplay from './components/common/ErrorDisplay'; // STAGE 17
import { LiveRegion } from './components/common/LiveRegion'; // STAGE 25
import SkipLink from './components/common/SkipLink'; // STAGE 25
import { UndoToast } from './components/common/UndoToast'; // ADDED
import { UndoToastWrapper } from './components/common/UndoToastWrapper'; // STAGE 2
import { useNetworkStatus } from './hooks/useNetworkStatus'; // STAGE 16
import { useKeyboardNav } from './hooks/useKeyboardNav'; // STAGE 25
import { offlineQueue } from './utils/offlineQueue'; // STAGE 16
import './styles/accessibility.css'; // STAGE 25
import './styles/rtl.css'; // STAGE 29: RTL support
import { PluginPermissionDialog } from './components/common/PluginPermissionDialog'; // STAGE R3
import apiClient from './api/client'; // STAGE 1: API client initialization


// Lazy load components
const GnaniCore = React.lazy(() => import('./components/gnani/GnaniCore'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ChatLayout = React.lazy(() => import('./layouts/ChatLayout'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const SharedConversationPage = React.lazy(() => import('./pages/SharedConversationPage')); // STAGE 22
// STAGE 2: Search Page
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const AnalyticsPage = React.lazy(() => import('./components/common/AnalyticsDashboard')); // STAGE R8

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
  const { isAuthenticated, isInitialized, initialize } = useUserStore();
  const { isOnline, wasOffline } = useNetworkStatus(); // STAGE 16
  useKeyboardNav(); // STAGE 25: Enable keyboard shortcuts

  // STAGE 1: Initialize user store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // STAGE 16: Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('[Offline Mode] Back online, processing queue...');
      offlineQueue.processQueue().catch(console.error);
    }
  }, [isOnline, wasOffline]);

  // Show loading screen only while checking authentication
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-jarvis-bg min-h-screen w-full overflow-hidden text-jarvis-text font-sans selection:bg-jarvis-blue selection:text-jarvis-bg">
      {/* STAGE 25: Skip to main content link */}
      <SkipLink />
      {/* STAGE 25: Screen reader announcements */}
      <LiveRegion />
      {/* STAGE 16: Offline indicator */}
      <OfflineIndicator />
      {/* STAGE 17: Error display */}
      <ErrorDisplay />
      {/* STAGE R3: Plugin Permission Dialog */}
      <PluginPermissionDialog />
      {/* STAGE 2: Undo Toast */}
      <UndoToastWrapper />
      <ToastProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <ErrorBoundary componentName="Login">
                <LoginPage />
              </ErrorBoundary>
            } />
            <Route path="/register" element={
              <ErrorBoundary componentName="Register">
                <RegisterPage />
              </ErrorBoundary>
            } />
            {/* STAGE 22: Public shared conversation route */}
            <Route path="/share/:shareId" element={
              <ErrorBoundary componentName="SharedConversation">
                <SharedConversationPage />
              </ErrorBoundary>
            } />

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

            {/* Analytics Route removed - now a modal */}

            <Route path="/settings" element={
              <RequireAuth>
                <ErrorBoundary>
                  <SettingsPage />
                </ErrorBoundary>
              </RequireAuth>
            } />

            {/* STAGE 2: Search Page */}
            <Route path="/search" element={
              <RequireAuth>
                <ErrorBoundary componentName="Search">
                  <SearchPage />
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