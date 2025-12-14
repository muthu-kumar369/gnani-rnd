// react/src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // Milliseconds, default 3000
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = uuidv4();
    const newToast: ToastMessage = { id, message, type, duration };
    setToasts((prevToasts) => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Notification Renderer will go here */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Placeholder for ToastNotification component - will be created next
interface ToastNotificationProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const styleConfig = {
    info: 'bg-status-info/10 border-status-info/20 text-status-info shadow-[0_4px_20px_rgba(var(--info-rgb),0.2)]',
    success: 'bg-status-success/10 border-status-success/20 text-status-success shadow-[0_4px_20px_rgba(var(--success-rgb),0.2)]',
    warning: 'bg-status-warning/10 border-status-warning/20 text-status-warning shadow-[0_4px_20px_rgba(var(--warning-rgb),0.2)]',
    error: 'bg-status-error/10 border-status-error/20 text-status-error shadow-[0_4px_20px_rgba(var(--error-rgb),0.2)]',
  }[toast.type];

  return (
    <div className={`${styleConfig} backdrop-blur-xl border px-4 py-3 rounded-xl flex items-center justify-between min-w-[300px] animate-slide-up`}>
      <span className="font-medium">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
        &times;
      </button>
    </div>
  );
};
