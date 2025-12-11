import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
    children: ReactNode;
    name: string;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches React errors and shows fallback UI
 * Stage 4 Task 4.10: Error Boundaries
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error
        logger.error('Component error caught by boundary', error, {
            component: this.props.name,
            componentStack: errorInfo.componentStack
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error info
        this.setState({
            errorInfo
        });
    }

    retry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        logger.info('Error boundary retry', {
            component: this.props.name
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-6">
                    <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-red-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-400">Something went wrong</h3>
                                <p className="text-sm text-gray-400">{this.props.name}</p>
                            </div>
                        </div>

                        {this.state.error && (
                            <div className="mb-4 p-3 bg-black/40 rounded border border-red-500/20">
                                <p className="text-sm text-red-300 font-mono">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.retry}
                                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>

                        {import.meta.env.MODE === 'development' && this.state.errorInfo && (
                            <details className="mt-4">
                                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="mt-2 p-3 bg-black/60 rounded text-xs text-gray-300 overflow-auto max-h-48">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
