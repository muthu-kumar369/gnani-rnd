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
            className="max-w-md bg-status-error/90 border border-status-error/50 rounded-lg p-4 shadow-lg backdrop-blur-sm"
        >
            <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-type-inverse flex-shrink-0 mt-0.5" />

                <div className="flex-1">
                    {/* Error Title */}
                    <h4 className="text-sm font-semibold text-type-inverse mb-1">
                        {parsedError.title}
                    </h4>

                    {/* Error Message */}
                    <p className="text-xs text-type-inverse/80 mb-3">
                        {parsedError.message}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {parsedError.action && onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-3 py-1.5 text-xs bg-status-error hover:bg-status-error/80 text-white rounded border border-white/20"
                            >
                                {parsedError.action}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const text = `${parsedError.title}\n${parsedError.message}\n${parsedError.code ? `Code: ${parsedError.code}` : ''}`;
                                navigator.clipboard.writeText(text);
                            }}
                            className="px-3 py-1.5 text-xs bg-black/20 hover:bg-black/30 text-white/90 rounded border border-white/10"
                        >
                            Copy Error
                        </button>
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1.5 text-xs bg-black/20 hover:bg-black/30 text-white/90 rounded border border-white/10"
                        >
                            Dismiss
                        </button>
                    </div>

                    {/* Error Code (Dev Mode) */}
                    {import.meta.env.MODE === 'development' && (
                        <p className="text-xs text-white/60 mt-2">
                            Error Code: {parsedError.code}
                        </p>
                    )}
                </div>

                <button onClick={onDismiss} className="text-white/80 hover:text-white flex-shrink-0">
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default ErrorToast;
