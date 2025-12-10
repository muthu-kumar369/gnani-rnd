import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
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
        const componentName = this.props.componentName || 'Component';
        console.error(`${componentName} error:`, error, errorInfo);

        this.setState({ errorInfo });

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        // Send to error tracking service
        this.reportError(error, errorInfo);

        // Send to Electron main process for logging
        if (typeof window !== 'undefined' && (window as any).electron?.log) {
            (window as any).electron.log('error', `${componentName} crashed`, {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
            });
        }
    }

    reportError = (error: Error, errorInfo: ErrorInfo) => {
        // TODO: Integrate with error tracking service (e.g., Sentry)
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
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const componentName = this.props.componentName || 'Component';

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
                            {componentName} Error
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
