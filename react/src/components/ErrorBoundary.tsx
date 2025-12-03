import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                    <p className="text-gray-300 mb-6">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
                        onClick={() => window.location.reload()}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
