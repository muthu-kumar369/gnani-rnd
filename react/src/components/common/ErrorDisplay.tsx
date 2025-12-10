import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useErrorStore } from '../../store/useErrorStore';
import ErrorToast from './ErrorToast';

const ErrorDisplay: React.FC = () => {
    const { errors, removeError } = useErrorStore();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            <AnimatePresence>
                {errors.map((errorItem) => {
                    // Convert string errors to ParsedError format
                    const errorObj = typeof errorItem.error === 'string'
                        ? { code: 'UNKNOWN_ERROR', title: 'Error', message: errorItem.error }
                        : errorItem.error;

                    return (
                        <ErrorToast
                            key={errorItem.id}
                            error={errorObj}
                            onDismiss={() => removeError(errorItem.id)}
                            onRetry={errorItem.retryFn}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default ErrorDisplay;
