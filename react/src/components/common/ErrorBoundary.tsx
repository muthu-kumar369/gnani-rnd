import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

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
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const componentName = this.props.componentName || 'Component';
        console.error(`${componentName} error:`, error, errorInfo);

        this.setState({ errorInfo });

        // Send to Electron main process for logging
        if (typeof window !== 'undefined' && (window as any).electron?.log) {
            (window as any).electron.log('error', `${componentName} crashed`, {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const componentName = this.props.componentName || 'Component';

            return (
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="max-w-md p-6 bg-red-50 border-2 border-red-200 rounded-lg shadow-lg">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-bold text-red-800">
                                {componentName} Error
                            </h2>
                        </div>

                        <p className="text-red-700 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                            <details className="mb-4">
                                <summary className="text-sm text-red-600 cursor-pointer hover:text-red-800">
                                    Error Details
                                </summary>
                                <pre className="mt-2 p-2 text-xs bg-red-100 rounded overflow-auto max-h-40">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
