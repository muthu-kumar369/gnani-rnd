// react/src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
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

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }[toast.type];

  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between`}>
      <span>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-4 text-white hover:text-gray-200">
        &times;
      </button>
    </div>
  );
};
