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
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Network & Queue</h3>

            <div className="flex items-center justify-between mb-6 p-3 bg-gray-900 rounded">
                <span className="text-sm text-gray-300">Connection Status</span>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>

            <div className="bg-gray-900 p-4 rounded text-center mb-4">
                <p className="text-gray-400 text-xs uppercase mb-1">Offline Queue</p>
                <div className="flex items-end justify-center space-x-1">
                    <span className={`text-3xl font-bold ${queueSize > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {queueSize}
                    </span>
                    <span className="text-gray-500 text-sm mb-1.5">requests</span>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={() => offlineQueue.processQueue()}
                    disabled={queueSize === 0 || !isOnline}
                    className={`w-full py-2 rounded text-xs font-bold transition-colors ${queueSize > 0 && isOnline
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Force Process Queue
                </button>
            </div>

            <div className="mt-4 text-[10px] text-gray-500 text-center">
                Automatic sync triggered when connection restores.
            </div>
        </div>
    );
};
