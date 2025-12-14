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
        <div className="bg-canvas-panel p-4 rounded-lg border border-line-base col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-type-primary">System Logs</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`text-xs px-2 py-1 rounded ${filter === 'all' ? 'bg-gnani-secondary text-type-inverse' : 'bg-canvas-surface text-type-muted'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('error')}
                        className={`text-xs px-2 py-1 rounded ${filter === 'error' ? 'bg-status-error text-white' : 'bg-canvas-surface text-type-muted'}`}
                    >
                        Errors ({errorCount})
                    </button>
                    <button
                        onClick={() => setFilter('warn')}
                        className={`text-xs px-2 py-1 rounded ${filter === 'warn' ? 'bg-status-warning text-white' : 'bg-canvas-surface text-type-muted'}`}
                    >
                        Warnings ({warnCount})
                    </button>
                    <button
                        // @ts-ignore
                        onClick={() => errorLogger.clearHistory && errorLogger.clearHistory()}
                        className="text-xs px-2 py-1 rounded bg-canvas-surface text-type-muted hover:bg-canvas-surface/80"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="bg-canvas-surface rounded h-64 overflow-y-auto custom-scrollbar p-2 font-mono text-xs">
                {filtered.map((log: any, i: number) => (
                    <div key={i} className={`mb-1 p-1 rounded flex items-start space-x-2 ${log.level === 'error' ? 'bg-status-error/20 text-status-error/80' :
                        log.level === 'warn' ? 'bg-status-warning/20 text-status-warning/80' :
                            'text-type-muted'
                        }`}>
                        <span className="opacity-50 min-w-[60px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`uppercase font-bold text-[10px] px-1 rounded min-w-[50px] text-center ${log.level === 'error' ? 'bg-status-error text-status-error/40 text-black' :
                            log.level === 'warn' ? 'bg-status-warning text-status-warning/40 text-black' :
                                'bg-gnani-secondary text-gnani-secondary/40 text-black'
                            }`}>
                            {log.level}
                        </span>
                        {log.context && <span className="opacity-70 text-type-muted">[{log.context}]</span>}
                        <span className="flex-1 break-words">
                            {log.message}
                            {log.error && (
                                <div className="mt-1 ml-4 text-status-error opacity-80 whitespace-pre-wrap">
                                    {log.error.message || JSON.stringify(log.error)}
                                </div>
                            )}
                        </span>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center text-type-muted italic py-8">No logs to display</div>
                )}
            </div>
        </div>
    );
};
