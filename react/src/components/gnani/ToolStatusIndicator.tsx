import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Code, Terminal, FileText, Settings, Cpu } from 'lucide-react';

interface ToolStatus {
    tool_name: string;
    status: 'starting' | 'running' | 'completed' | 'failed';
    progress: number;
    message: string;
    elapsed_ms: number;
}

interface ToolStatusIndicatorProps {
    status: ToolStatus | null;
}

const ToolStatusIndicator: React.FC<ToolStatusIndicatorProps> = ({ status }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (status) {
            setIsVisible(true);
            if (status.status === 'completed' || status.status === 'failed') {
                // Auto-hide after a few seconds on completion/failure
                const timer = setTimeout(() => {
                    setIsVisible(false);
                }, 3000);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [status]);

    if (!status && !isVisible) return null;

    const getIcon = (name: string) => {
        if (name.includes('search') || name.includes('web')) return <Search className="w-4 h-4" />;
        if (name.includes('code') || name.includes('script')) return <Code className="w-4 h-4" />;
        if (name.includes('terminal') || name.includes('command')) return <Terminal className="w-4 h-4" />;
        if (name.includes('file') || name.includes('read')) return <FileText className="w-4 h-4" />;
        if (name.includes('setting') || name.includes('config')) return <Settings className="w-4 h-4" />;
        return <Cpu className="w-4 h-4" />;
    };

    const getColor = (s: string) => {
        switch (s) {
            case 'completed': return 'text-green-400 border-green-500/30 bg-green-500/10';
            case 'failed': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && status && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`
            fixed bottom-24 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-3 px-4 py-2.5 rounded-full
            backdrop-blur-md border shadow-lg
            ${getColor(status.status)}
          `}
                >
                    <div className="relative flex items-center justify-center">
                        {status.status === 'running' && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-current border-t-transparent rounded-full opacity-50"
                            />
                        )}
                        {getIcon(status.tool_name)}
                    </div>

                    <div className="flex flex-col min-w-[180px]">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {status.tool_name.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium whitespace-nowrap">
                            {status.message}
                        </span>
                    </div>

                    {status.status === 'running' && (
                        <span className="text-xs font-mono opacity-60 tabular-nums">
                            {(status.elapsed_ms / 1000).toFixed(1)}s
                        </span>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ToolStatusIndicator;
