import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { parseError } from '../../utils/errorParser';

interface ErrorToastProps {
    error: any;
    onRetry?: () => void;
    onDismiss: () => void;
    autoHideDuration?: number;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
    error,
    onRetry,
    onDismiss,
    autoHideDuration = 5000,
}) => {
    const parsedError = parseError(error);

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
            className="max-w-md bg-red-950/90 border border-red-500/50 rounded-lg p-4 shadow-lg backdrop-blur-sm"
        >
            <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />

                <div className="flex-1">
                    {/* Error Title */}
                    <h4 className="text-sm font-semibold text-red-100 mb-1">
                        {parsedError.title}
                    </h4>

                    {/* Error Message */}
                    <p className="text-xs text-red-200/80 mb-3">
                        {parsedError.message}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {parsedError.action && onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-400 text-white rounded"
                            >
                                {parsedError.action}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const text = `${parsedError.title}\n${parsedError.message}\n${parsedError.code ? `Code: ${parsedError.code}` : ''}`;
                                navigator.clipboard.writeText(text);
                            }}
                            className="px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 rounded"
                        >
                            Copy Error
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded"
                        >
                            Dismiss
                        </button>
                    </div>

                    {/* Error Code (Dev Mode) */}
                    {import.meta.env.MODE === 'development' && (
                        <p className="text-xs text-red-400/60 mt-2">
                            Error Code: {parsedError.code}
                        </p>
                    )}
                </div>

                <button onClick={onDismiss} className="text-red-400 hover:text-red-300 flex-shrink-0">
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default ErrorToast;
