import React, { useState, useEffect } from 'react';
import { offlineQueue } from '../../utils/offlineQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkMonitor: React.FC = () => {
    const { isOnline } = useNetworkStatus();
    const [queueSize, setQueueSize] = useState(offlineQueue.size());

    useEffect(() => {
        const interval = setInterval(() => {
            setQueueSize(offlineQueue.size());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-canvas-panel p-4 rounded-lg border border-line-base">
            <h3 className="text-lg font-semibold text-type-primary mb-4">Network & Queue</h3>

            <div className="flex items-center justify-between mb-6 p-3 bg-canvas-surface rounded">
                <span className="text-sm text-type-secondary">Connection Status</span>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-status-success/30 text-status-success' : 'bg-status-error/30 text-status-error'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-status-success' : 'bg-status-error'}`}></span>
                    <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>

            <div className="bg-canvas-surface p-4 rounded text-center mb-4">
                <p className="text-type-muted text-xs uppercase mb-1">Offline Queue</p>
                <div className="flex items-end justify-center space-x-1">
                    <span className={`text-3xl font-bold ${queueSize > 0 ? 'text-status-warning' : 'text-type-muted'}`}>
                        {queueSize}
                    </span>
                    <span className="text-type-muted text-sm mb-1.5">requests</span>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={() => offlineQueue.processQueue()}
                    disabled={queueSize === 0 || !isOnline}
                    className={`w-full py-2 rounded text-xs font-bold transition-colors ${queueSize > 0 && isOnline
                        ? 'bg-gnani-primary hover:bg-gnani-primary/90 text-type-inverse'
                        : 'bg-canvas-surface text-type-muted cursor-not-allowed'
                        }`}
                >
                    Force Process Queue
                </button>
            </div>

            <div className="mt-4 text-[10px] text-type-muted text-center">
                Automatic sync triggered when connection restores.
            </div>
        </div>
    );
};
