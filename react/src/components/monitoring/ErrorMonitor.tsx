import React, { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';

export const ErrorMonitor: React.FC = () => {
    // @ts-ignore - getHistory() added recently
    const [history, setHistory] = useState(errorLogger.getHistory ? errorLogger.getHistory() : []);
    const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');

    useEffect(() => {
        const interval = setInterval(() => {
            // @ts-ignore
            if (errorLogger.getHistory) {
                // @ts-ignore
                setHistory(errorLogger.getHistory());
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const filtered = history.filter((item: any) =>
        filter === 'all' ? true : item.level === filter
    );

    const errorCount = history.filter((h: any) => h.level === 'error').length;
    const warnCount = history.filter((h: any) => h.level === 'warn').length;

    return (
        <div className="rounded-xl border shadow-sm transition-all duration-300 border-black/5 dark:border-white/10 bg-white dark:bg-[#1a2639] col-span-1 md:col-span-2 lg:col-span-3 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gnani-primary animate-pulse" />
                    System Logs
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${filter === 'all'
                            ? 'bg-gnani-primary text-white shadow-lg shadow-gnani-primary/20'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('error')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${filter === 'error'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10'
                            }`}
                    >
                        Errors ({errorCount})
                    </button>
                    <button
                        onClick={() => setFilter('warn')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${filter === 'warn'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-amber-500/10'
                            }`}
                    >
                        Warnings ({warnCount})
                    </button>
                    <button
                        // @ts-ignore
                        onClick={() => errorLogger.clearHistory && errorLogger.clearHistory()}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="h-64 overflow-y-auto custom-scrollbar p-0 font-mono text-xs bg-white dark:bg-[#0d1520]">
                {filtered.map((log: any, i: number) => (
                    <div key={i} className={`px-4 py-2 border-b border-black/5 dark:border-white/5 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${log.level === 'error' ? 'bg-red-50/50 dark:bg-red-900/10' :
                        log.level === 'warn' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                        }`}>
                        <span className="opacity-40 min-w-[65px] text-[10px] pt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded min-w-[50px] text-center tracking-wider ${log.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                            log.level === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                            }`}>
                            {log.level}
                        </span>
                        <div className="flex-1 min-w-0">
                            <span className="block break-words text-gray-700 dark:text-gray-300">
                                {log.context && <span className="opacity-50 mr-2 text-[10px] uppercase tracking-wider">[{log.context}]</span>}
                                {log.message}
                            </span>
                            {log.error && (
                                <div className="mt-1.5 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 ml-0 border border-red-100 dark:border-red-500/20 whitespace-pre-wrap font-mono text-[10px]">
                                    {log.error.message || JSON.stringify(log.error)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 italic gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                        <span>No logs to display</span>
                    </div>
                )}
            </div>
        </div>
    );
};
