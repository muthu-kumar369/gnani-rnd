# Stage 15: Error Boundary Implementation

## Overview
Implement comprehensive error boundary with retry logic, error reporting, and graceful degradation.

## Current State Analysis

**Current Behavior**:
- No error boundary - app crashes on unhandled errors
- Errors only logged to console
- No user-friendly error messages
- No recovery mechanism

**Gap**: Production apps need robust error handling with user-friendly recovery options.

---

## Implementation Steps

### Step 1: Create Error Boundary Component

**File**: `D:\learning\hey\gnani-rnd\react\src\components\common\ErrorBoundary.tsx` (NEW)

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({ errorInfo });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error tracking service
    console.log('Reporting error to tracking service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-400 p-8">
          <div className="max-w-md w-full bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertTriangle size={48} className="text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center mb-4">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-sm text-cyan-500/80 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {/* Error Details (Dev Mode) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-xs">
                <summary className="cursor-pointer text-cyan-500/60 hover:text-cyan-500">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-black/50 rounded overflow-auto max-h-40 text-red-400">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded transition-colors"
              >
                <Home size={16} />
                Go Home
              </button>
            </div>

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <p className="text-xs text-cyan-500/40 text-center mt-4">
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Step 2: Wrap App with Error Boundary

**File**: `D:\learning\hey\gnani-rnd\react\src\main.tsx`

```tsx
import ErrorBoundary from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Send to analytics/monitoring
        console.error('Global error:', error, errorInfo);
      }}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

### Step 3: Add Route-Level Error Boundaries

**File**: `D:\learning\hey\gnani-rnd\react\src\App.tsx`

```tsx
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <ErrorBoundary fallback={<LoginErrorFallback />}>
            <LoginPage />
          </ErrorBoundary>
        } />
        
        <Route path="/chat" element={
          <ErrorBoundary fallback={<ChatErrorFallback />}>
            <ChatLayout />
          </ErrorBoundary>
        } />
      </Routes>
    </Router>
  );
}
```

### Step 4: Create Error Toast Component

**File**: `D:\learning\hey\gnani-rnd\react\src\components\common\ErrorToast.tsx` (NEW)

```tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  autoHideDuration?: number;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  onRetry,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(onDismiss, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 z-50 max-w-md bg-red-950/90 border border-red-500/50 rounded-lg p-4 shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <p className="text-sm text-red-100">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-red-300 hover:text-red-200 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default ErrorToast;
```

### Step 5: Create Error Store for Global Error Management

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useErrorStore.ts` (NEW)

```typescript
import { create } from 'zustand';

interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    retryFn?: () => void;
  }>;
  
  addError: (message: string, retryFn?: () => void) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  addError: (message, retryFn) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      errors: [...state.errors, { id, message, type: 'error', retryFn }],
    }));
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  clearErrors: () => set({ errors: [] }),
}));
```

---

## Testing Instructions

1. **Test Error Boundary**:
   - Throw error in component: `throw new Error('Test error')`
   - ✅ Verify error UI appears
   - ✅ Click "Try Again" → Component re-renders
   - ✅ Click "Go Home" → Redirects to home

2. **Test Error Toast**:
   - Trigger network error
   - ✅ Verify toast appears
   - ✅ Verify auto-dismiss after 5s
   - ✅ Click retry → Retries action

3. **Test Error Store**:
   - Add multiple errors
   - ✅ Verify all errors shown
   - ✅ Dismiss one → Others remain
   - ✅ Clear all → All removed

---

## Success Criteria

- ✅ App doesn't crash on errors
- ✅ User-friendly error messages
- ✅ Retry mechanism works
- ✅ Errors reported to tracking service
- ✅ Route-level error boundaries isolate failures
- ✅ Error toasts for non-critical errors

---

## Estimated Time: 8 hours
