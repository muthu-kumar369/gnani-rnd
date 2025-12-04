import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
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
        // Here you would typically log to an error reporting service
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-jarvis-bg text-jarvis-text p-4">
                    <div className="bg-jarvis-panel border border-jarvis-border rounded-lg p-8 max-w-md w-full shadow-jarvis-glow text-center">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-red-500/10 rounded-full text-red-400 border border-red-500/20">
                                <AlertTriangle size={48} />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-jarvis-blue mb-2">System Malfunction</h1>
                        <p className="text-jarvis-cyan/70 mb-6">
                            An unexpected error has occurred in the neural interface.
                        </p>

                        {this.state.error && (
                            <div className="bg-black/30 border border-jarvis-border rounded p-3 mb-6 text-left overflow-auto max-h-32">
                                <code className="text-xs font-mono text-red-300">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-jarvis-blue/20 border border-jarvis-blue text-jarvis-blue hover:bg-jarvis-blue/30 rounded flex items-center justify-center gap-2 transition-all group"
                        >
                            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            Reinitialize System
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
